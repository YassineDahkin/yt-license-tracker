import { inngest } from "../client"
import { db } from "@/lib/db"

export const nightlyCheckFunction = inngest.createFunction(
  {
    id: "nightly-check",
    name: "Nightly License Check",
    triggers: [{ cron: "0 8 * * *" }],
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", () =>
      db.user.findMany({
        where: { licenses: { some: {} } },
        select: { id: true },
      }),
    )

    const channels = await step.run("fetch-channels", () =>
      db.channel.findMany({
        select: { id: true, userId: true },
      }),
    )

    const expiryEvents = users.map((u: { id: string }) => ({
      name: "alerts/check-expiry.requested" as const,
      data: { userId: u.id },
    }))

    const analyticsEvents = channels.map((c: { id: string; userId: string }) => ({
      name: "analytics/fetch.requested" as const,
      data: { userId: c.userId, channelId: c.id },
    }))

    const dropEvents = users.map((u: { id: string }) => ({
      name: "analytics/check-drops.requested" as const,
      data: { userId: u.id },
    }))

    await step.sendEvent("fan-out-all", [
      ...expiryEvents,
      ...analyticsEvents,
      ...dropEvents,
    ])

    return { usersChecked: users.length, channelsChecked: channels.length }
  },
)
