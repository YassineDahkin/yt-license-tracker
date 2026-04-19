import { inngest } from "../client"
import { db } from "@/lib/db"
import { trackRiskLevel, worstRisk } from "@/lib/risk-scoring"
import type { RiskLevel } from "@/lib/risk-scoring"

// Triggered after a license CSV is uploaded.
// Re-scores every video in the user's channels.
export const scoreVideosFunction = inngest.createFunction(
  {
    id: "score-videos",
    name: "Score Video Risk Levels",
    triggers: [{ event: "licenses/uploaded" }],
    concurrency: { limit: 2 },
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string }

    const channels = await step.run("fetch-channels", () =>
      db.channel.findMany({
        where: { userId },
        select: { id: true },
      }),
    )
    const channelIds = channels.map((c: { id: string }) => c.id)

    const videos = await step.run("fetch-videos", () =>
      db.video.findMany({
        where: { channelId: { in: channelIds } },
        select: { id: true },
        orderBy: { viewCount: "desc" },
      }),
    )

    let scored = 0

    // Process in chunks of 50 to avoid long-running steps
    const CHUNK = 50
    for (let i = 0; i < videos.length; i += CHUNK) {
      const chunk = videos.slice(i, i + CHUNK)
      await step.run(`score-chunk-${i}`, async () => {
        for (const video of chunk) {
          const videoTracks = await db.videoTrack.findMany({
            where: { videoId: video.id },
            include: {
              track: {
                include: {
                  licenses: {
                    where: { userId },
                  },
                },
              },
            },
          })

          let risk: RiskLevel = "UNKNOWN"

          if (videoTracks.length > 0) {
            const trackRisks: RiskLevel[] = videoTracks.map((vt) => {
              const licenses = vt.track.licenses
              if (licenses.length === 0) return "UNKNOWN" as RiskLevel
              // Best-case across all licenses for this track
              const trackLevelRisks = licenses.map((lic) =>
                trackRiskLevel(lic.expiresAt ?? null),
              )
              // Use the best (lowest risk) license for this track
              const best = trackLevelRisks.sort(
                (a, b) =>
                  (a === "SAFE" ? 0 : a === "AT_RISK" ? 1 : a === "EXPIRED" ? 2 : 3) -
                  (b === "SAFE" ? 0 : b === "AT_RISK" ? 1 : b === "EXPIRED" ? 2 : 3),
              )[0]
              return best
            })
            risk = worstRisk(trackRisks)
          }

          await db.video.update({
            where: { id: video.id },
            data: { riskScore: risk },
          })
          scored++
        }
      })
    }

    return { scored }
  },
)
