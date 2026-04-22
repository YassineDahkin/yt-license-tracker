import { Resend } from "resend"
import { render } from "@react-email/components"
import { LicenseExpiryWarning } from "@/emails/license-expiry-warning"
import { UnlicensedTrackAlert } from "@/emails/unlicensed-track-alert"

// Lazy init — don't crash at module load when key is absent
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set")
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "TuneGuard <onboarding@resend.dev>"

interface LicenseExpiryEmailParams {
  to: string
  userName: string
  trackTitle: string
  artist: string
  platform: string
  expiresAt: Date
  daysLeft: number
}

export async function sendLicenseExpiryEmail(params: LicenseExpiryEmailParams) {
  const { to, daysLeft, ...rest } = params
  const urgency = daysLeft <= 3 ? "URGENT: " : ""

  const html = await render(
    LicenseExpiryWarning({ ...rest, daysLeft }) as React.ReactElement,
  )

  const subject = daysLeft <= 0
    ? `URGENT: License for "${params.trackTitle}" has expired`
    : `${urgency}License for "${params.trackTitle}" expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  return data
}

interface UnlicensedTrackEmailParams {
  to: string
  userName: string
  trackTitle: string
  artist: string
  videoTitle: string
  youtubeVideoId: string
}

export async function sendUnlicensedTrackEmail(params: UnlicensedTrackEmailParams) {
  const html = await render(UnlicensedTrackAlert(params) as React.ReactElement)

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: params.to,
    subject: `⚠️ Unlicensed music detected: "${params.trackTitle}" in your video`,
    html,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  return data
}
