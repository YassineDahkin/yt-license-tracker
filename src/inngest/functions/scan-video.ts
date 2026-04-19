import { inngest } from "../client"
import { db } from "@/lib/db"
import { recognizeMusicInVideo } from "@/lib/audd"
import { parseTracksFromDescription } from "@/lib/description-parser"

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
      const [auddResult, video] = await Promise.all([
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

        if (auddResult) {
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

      // Alert for any detected track that has no valid license
      if (savedTrackIds.length > 0) {
        await step.run("check-unlicensed-tracks", async () => {
          const now = new Date()

          for (const trackId of savedTrackIds) {
            const track = await db.track.findUnique({ where: { id: trackId } })
            if (!track) continue

            const validLicense = await db.license.findFirst({
              where: {
                userId,
                trackId,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: now } },
                ],
              },
            })

            if (validLicense) continue

            // Dedup: skip if same alert already created for this video+track in last 7 days
            const existing = await db.alert.findFirst({
              where: {
                userId,
                type: "SCAN_COMPLETE",
                metadata: {
                  path: ["videoId"],
                  equals: videoId,
                },
                createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
              },
            })
            if (existing) continue

            await db.alert.create({
              data: {
                userId,
                type: "SCAN_COMPLETE",
                title: "Unlicensed track detected",
                body: `"${track.title}" by ${track.artist} was detected in "${video?.title ?? videoId}" but no valid license was found.`,
                metadata: { videoId, trackId, trackTitle: track.title, artist: track.artist },
              },
            })
          }
        })
      }

      return { videoId, auddFound: !!auddResult, descriptionTracksFound: descriptionTracks.length }
    } catch (err) {
      await db.video.update({
        where: { id: videoId },
        data: { scanStatus: "FAILED" },
      })
      throw err
    }
  },
)
