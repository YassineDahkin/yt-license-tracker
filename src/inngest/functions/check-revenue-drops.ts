import { inngest } from "../client"
import { db } from "@/lib/db"

const DROP_THRESHOLD = 0.25 // 25% drop triggers alert

export const checkRevenueDropsFunction = inngest.createFunction(
  {
    id: "check-revenue-drops",
    name: "Check Revenue Drops",
    triggers: [{ event: "analytics/check-drops.requested" }],
    retries: 0,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string }

    const user = await step.run("fetch-user", () =>
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      }),
    )
    if (!user) return { skipped: true }

    const channels = await step.run("fetch-channels", () =>
      db.channel.findMany({
        where: { userId },
        select: { id: true, youtubeChannelId: true, title: true },
      }),
    )

    const now = new Date()
    // endDate = 2 days ago (analytics lag)
    const recentEnd = new Date(now)
    recentEnd.setDate(recentEnd.getDate() - 2)
    const recentStart = new Date(recentEnd)
    recentStart.setDate(recentStart.getDate() - 7)

    const baselineEnd = new Date(recentStart)
    const baselineStart = new Date(baselineEnd)
    baselineStart.setDate(baselineStart.getDate() - 30)

    let alertsCreated = 0

    for (const channel of channels) {
      const [recentSnaps, baselineSnaps] = await step.run(`fetch-snaps-${channel.id}`, async () => {
        const recent = await db.revenueSnapshot.findMany({
          where: {
            channelId: channel.id,
            date: { gte: recentStart, lte: recentEnd },
          },
        })
        const baseline = await db.revenueSnapshot.findMany({
          where: {
            channelId: channel.id,
            date: { gte: baselineStart, lte: baselineEnd },
          },
        })
        return [recent, baseline]
      })

      if (recentSnaps.length === 0 || baselineSnaps.length === 0) continue

      const recentRPM = recentSnaps.reduce((s, r) => s + (r.rpm ?? 0), 0) / recentSnaps.length
      const baselineRPM = baselineSnaps.reduce((s, r) => s + (r.rpm ?? 0), 0) / baselineSnaps.length

      if (baselineRPM === 0) continue

      const dropRatio = (baselineRPM - recentRPM) / baselineRPM

      if (dropRatio < DROP_THRESHOLD) continue

      // Dedup: skip if same alert created in last 7 days
      const existing = await db.alert.findFirst({
        where: {
          userId,
          type: "REVENUE_DROP",
          metadata: { path: ["channelId"], equals: channel.id },
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      })
      if (existing) continue

      const dropPct = Math.round(dropRatio * 100)

      await step.run(`create-alert-${channel.id}`, () =>
        db.alert.create({
          data: {
            userId,
            type: "REVENUE_DROP",
            title: `Revenue dropped ${dropPct}% on ${channel.title}`,
            body: `RPM dropped from $${baselineRPM.toFixed(2)} (30-day avg) to $${recentRPM.toFixed(2)} (last 7 days). This may indicate a Content ID claim on one or more videos.`,
            metadata: { channelId: channel.id, dropPct, recentRPM, baselineRPM },
          },
        }),
      )
      alertsCreated++
    }

    return { userId, alertsCreated }
  },
)
