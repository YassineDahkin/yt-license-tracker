import { inngest } from "../client"
import { db } from "@/lib/db"
import { sendLicenseExpiryEmail } from "@/lib/resend"

// Thresholds ordered highest → lowest so each license gets the most urgent alert only.
// e.g. 5 days left → only LICENSE_EXPIRY_3 alert (it's within 14 AND 30 AND 3, but 3 is most urgent)
const THRESHOLDS = [
  { days: 3,  alertType: "LICENSE_EXPIRY_3"  as const },
  { days: 14, alertType: "LICENSE_EXPIRY_14" as const },
  { days: 30, alertType: "LICENSE_EXPIRY_30" as const },
]

export const checkLicenseExpiryFunction = inngest.createFunction(
  {
    id: "check-license-expiry",
    name: "Check License Expiry",
    triggers: [{ event: "alerts/check-expiry.requested" }],
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string }

    const user = await step.run("fetch-user", () =>
      db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } }),
    )
    if (!user) return { skipped: true }

    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Fetch all licenses expiring within 30 days in one query
    const expiringLicenses = await step.run("fetch-expiring-licenses", () =>
      db.license.findMany({
        where: {
          userId,
          expiresAt: { gte: now, lte: in30Days },
        },
        include: { track: true },
      }),
    )

    let alertsCreated = 0

    for (const license of expiringLicenses) {
      const expiresDate = new Date(license.expiresAt as unknown as string)
      const daysLeft = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Pick most urgent threshold that applies
      const threshold = THRESHOLDS.find(t => daysLeft <= t.days)
      if (!threshold) continue

      const { days, alertType } = threshold

      // Dedup: skip if same alert type for this license already created today
      const existing = await db.alert.findFirst({
        where: {
          userId,
          type: alertType,
          metadata: { path: ["licenseId"], equals: license.id },
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      })
      if (existing) continue

      const title = `License expiring in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
      const body = `"${license.track.title}" by ${license.track.artist} (${license.platform}) expires on ${expiresDate.toLocaleDateString()}.`

      await step.run(`create-alert-${license.id}`, () =>
        db.alert.create({
          data: {
            userId,
            type: alertType,
            title,
            body,
            metadata: { licenseId: license.id, trackId: license.track.id, daysLeft },
          },
        }),
      )

      if (process.env.RESEND_API_KEY) {
        await step.run(`send-email-${license.id}`, () =>
          sendLicenseExpiryEmail({
            to: user.email,
            userName: user.name ?? user.email,
            trackTitle: license.track.title,
            artist: license.track.artist,
            platform: license.platform,
            expiresAt: expiresDate,
            daysLeft,
          }),
        )
      }

      alertsCreated++
    }

    return { userId, alertsCreated }
  },
)
