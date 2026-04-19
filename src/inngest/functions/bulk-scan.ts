import { inngest } from "../client"
import { db } from "@/lib/db"

export const bulkScanFunction = inngest.createFunction(
  {
    id: "bulk-scan-channel",
    name: "Bulk Scan Channel",
    triggers: [{ event: "scan/channel.requested" }],
  },
  async ({ event, step }) => {
    const { channelId, userId } = event.data as {
      channelId: string
      userId: string
    }

    // Reset any stuck SCANNING videos back to PENDING
    await step.run("reset-stuck-scans", () =>
      db.video.updateMany({
        where: { channelId, scanStatus: "SCANNING" },
        data: { scanStatus: "PENDING" },
      }),
    )

    const videos = await step.run("fetch-pending-videos", () =>
      db.video.findMany({
        where: { channelId, scanStatus: "PENDING" },
        select: { id: true, youtubeVideoId: true },
        orderBy: { viewCount: "desc" },
      }),
    )

    if (videos.length === 0) {
      return { queued: 0, message: "No pending videos to scan" }
    }

    await step.sendEvent(
      "send-scan-events",
      videos.map((video: { id: string; youtubeVideoId: string }) => ({
        name: "scan/video.requested" as const,
        data: { videoId: video.id, youtubeVideoId: video.youtubeVideoId, userId },
      })),
    )

    return { queued: videos.length }
  },
)
