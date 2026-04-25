import { inngest } from "../client"
import { db } from "@/lib/db"
import { recognizeMusicInVideo } from "@/lib/audd"
import { parseTracksFromDescription } from "@/lib/description-parser"
import { sendUnlicensedTrackEmail } from "@/lib/resend"

export const scanVideoFunction = inngest.createFunction(
  {
    id: "scan-video",
    name: "Scan Video for Music",
    triggers: [{ event: "scan/video.requested" }],
    retries: 0,
  },
  async ({ event, step }) => {
    const { videoId, youtubeVideoId, userId } = event.data as {
      videoId: string
      youtubeVideoId: string
      userId: string
    }

    await step.run("mark-scanning", () =>
      db.video.update({
        where: { id: videoId },
        data: { scanStatus: "SCANNING" },
      }),
    )

    try {
      const [auddResults, video] = await Promise.all([
        step.run("audd-recognize", () => recognizeMusicInVideo(youtubeVideoId)),
        step.run("fetch-description", () =>
          db.video.findUnique({
            where: { id: videoId },
            select: { description: true, title: true },
          }),
        ),
      ])

      const descriptionTracks = parseTracksFromDescription(video?.description ?? "")

      const savedTrackIds: string[] = []

      await step.run("save-tracks", async () => {
        const saves: Promise<unknown>[] = []

        for (const auddResult of auddResults) {
          const isrcKey =
            auddResult.isrc ??
            `audd::${auddResult.artist.toLowerCase()}::${auddResult.title.toLowerCase()}`
          const track = await db.track.upsert({
            where: { isrc: isrcKey },
            update: { title: auddResult.title, artist: auddResult.artist, label: auddResult.label ?? null },
            create: { title: auddResult.title, artist: auddResult.artist, isrc: isrcKey, label: auddResult.label ?? null },
          })
          savedTrackIds.push(track.id)
          saves.push(
            db.videoTrack.upsert({
              where: { videoId_trackId: { videoId, trackId: track.id } },
              update: {},
              create: { videoId, trackId: track.id, source: "AUDD", confidence: 1.0 },
            }),
          )
        }

        for (const dt of descriptionTracks) {
          const fallbackKey = `desc::${dt.artist.toLowerCase()}::${dt.title.toLowerCase()}`
          const track = await db.track.upsert({
            where: { isrc: fallbackKey },
            update: {},
            create: { title: dt.title, artist: dt.artist, isrc: fallbackKey },
          })
          savedTrackIds.push(track.id)
          saves.push(
            db.videoTrack.upsert({
              where: { videoId_trackId: { videoId, trackId: track.id } },
              update: {},
              create: { videoId, trackId: track.id, source: "DESCRIPTION_PARSE" },
            }),
          )
        }

        await Promise.all(saves)
      })

      await step.run("mark-completed", () =>
        db.video.update({
          where: { id: videoId },
          data: { scanStatus: "COMPLETED", scannedAt: new Date() },
        }),
      )

      // After scan: score video risk + alert on unlicensed tracks
      if (savedTrackIds.length > 0) {
        await step.run("score-and-alert-unlicensed", async () => {
          const now = new Date()
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          })

          let videoRisk: "SAFE" | "AT_RISK" | "EXPIRED" | "UNKNOWN" = "UNKNOWN"

          for (const trackId of savedTrackIds) {
            const track = await db.track.findUnique({ where: { id: trackId } })
            if (!track) continue

            // Check best available license for this track
            const licenses = await db.license.findMany({
              where: { userId, trackId },
            })

            let trackRisk: "SAFE" | "AT_RISK" | "EXPIRED" | "UNKNOWN" = "UNKNOWN"

            if (licenses.length === 0) {
              // Music detected, no license → AT_RISK
              trackRisk = "AT_RISK"
            } else {
              // Pick best license
              for (const lic of licenses) {
                if (!lic.expiresAt) { trackRisk = "SAFE"; break }
                const daysLeft = (new Date(lic.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                if (new Date(lic.expiresAt) < now) {
                  if (trackRisk !== "SAFE" && trackRisk !== "AT_RISK") trackRisk = "EXPIRED"
                } else if (daysLeft <= 30) {
                  if (trackRisk !== "SAFE") trackRisk = "AT_RISK"
                } else {
                  trackRisk = "SAFE"
                }
              }
            }

            // Worst risk wins for the video
            const PRIORITY = { EXPIRED: 3, AT_RISK: 2, SAFE: 1, UNKNOWN: 0 }
            if (PRIORITY[trackRisk] > PRIORITY[videoRisk]) videoRisk = trackRisk

            // Alert + email only for unlicensed (AT_RISK from no license)
            if (trackRisk === "AT_RISK" && licenses.length === 0) {
              const existing = await db.alert.findFirst({
                where: {
                  userId,
                  type: "SCAN_COMPLETE",
                  metadata: { path: ["videoId"], equals: videoId },
                  createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
                },
              })
              if (!existing) {
                await db.alert.create({
                  data: {
                    userId,
                    type: "SCAN_COMPLETE",
                    title: "Unlicensed track detected",
                    body: `"${track.title}" by ${track.artist} was detected in "${video?.title ?? videoId}" but no valid license was found.`,
                    metadata: { videoId, trackId, trackTitle: track.title, artist: track.artist },
                  },
                })

                if (process.env.RESEND_API_KEY && user) {
                  await sendUnlicensedTrackEmail({
                    to: user.email,
                    userName: user.name ?? user.email,
                    trackTitle: track.title,
                    artist: track.artist,
                    videoTitle: video?.title ?? youtubeVideoId,
                    youtubeVideoId,
                  }).catch(() => {}) // non-fatal
                }
              }
            }
          }

          // Update video risk score based on detected tracks + licenses
          if (videoRisk !== "UNKNOWN") {
            await db.video.update({
              where: { id: videoId },
              data: { riskScore: videoRisk },
            })
          }
        })
      }

      return { videoId, auddFound: auddResults.length, descriptionTracksFound: descriptionTracks.length }
    } catch (err) {
      await db.video.update({
        where: { id: videoId },
        data: { scanStatus: "FAILED" },
      })
      throw err
    }
  },
)
