import { inngest } from "../client"
import { db } from "@/lib/db"
import { fetchChannelRevenue } from "@/lib/analytics"
import { getFreshAccessToken } from "@/lib/token"

export const fetchAnalyticsFunction = inngest.createFunction(
  {
    id: "fetch-analytics",
    name: "Fetch Channel Analytics",
    triggers: [{ event: "analytics/fetch.requested" }],
    retries: 1,
  },
  async ({ event, step }) => {
    const { userId, channelId } = event.data as { userId: string; channelId: string }

    const accessToken = await step.run("fetch-account", () =>
      getFreshAccessToken(userId),
    )
    if (!accessToken) return { skipped: true, reason: "no access token" }

    const channel = await step.run("fetch-channel", () =>
      db.channel.findFirst({
        where: { id: channelId, userId },
        select: { youtubeChannelId: true },
      }),
    )
    if (!channel) return { skipped: true, reason: "channel not found" }

    // Analytics data has 48-72h lag — use endDate = 2 days ago
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 2)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 30)

    const fmt = (d: Date) => d.toISOString().split("T")[0]

    const snapshots = await step.run("fetch-revenue", () =>
      fetchChannelRevenue(
        accessToken,
        channel.youtubeChannelId,
        fmt(startDate),
        fmt(endDate),
      ).catch(() => []),
    )

    if (snapshots.length === 0) return { channelId, snapshots: 0 }

    // Map youtubeVideoId → DB video id
    const youtubeIds = [...new Set(snapshots.map((s) => s.youtubeVideoId))]
    const videos = await step.run("fetch-videos", () =>
      db.video.findMany({
        where: { youtubeVideoId: { in: youtubeIds }, channelId },
        select: { id: true, youtubeVideoId: true },
      }),
    )
    const videoMap = Object.fromEntries(videos.map((v) => [v.youtubeVideoId, v.id]))

    let saved = 0
    for (const snap of snapshots) {
      const dbVideoId = videoMap[snap.youtubeVideoId]
      if (!dbVideoId) continue

      await step.run(`save-snapshot-${snap.youtubeVideoId}-${snap.date}`, () =>
        db.revenueSnapshot.upsert({
          where: { channelId_date: { channelId, date: new Date(snap.date) } },
          create: {
            channelId,
            date: new Date(snap.date),
            estimatedRevenue: snap.estimatedRevenue,
            views: snap.views,
          },
          update: {
            estimatedRevenue: snap.estimatedRevenue,
            views: snap.views,
          },
        }).catch(() => null),
      )
      saved++
    }

    return { channelId, saved }
  },
)
