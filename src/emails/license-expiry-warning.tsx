import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components"

interface LicenseExpiryWarningProps {
  userName: string
  trackTitle: string
  artist: string
  platform: string
  expiresAt: Date
  daysLeft: number
}

function platformLabel(p: string) {
  switch (p) {
    case "EPIDEMIC_SOUND": return "Epidemic Sound"
    case "ARTLIST": return "Artlist"
    default: return p
  }
}

function urgencyColor(days: number) {
  if (days <= 3) return "#dc2626"
  if (days <= 14) return "#d97706"
  return "#2563eb"
}

export function LicenseExpiryWarning({
  userName,
  trackTitle,
  artist,
  platform,
  expiresAt,
  daysLeft,
}: LicenseExpiryWarningProps) {
  const isExpired = daysLeft <= 0
  const color = isExpired ? "#dc2626" : urgencyColor(daysLeft)
  const urgency = daysLeft <= 3 ? "URGENT: " : ""

  return (
    <Html>
      <Head />
      <Preview>
        {isExpired
          ? `Your license for "${trackTitle}" has expired`
          : `${urgency}Your license for "${trackTitle}" expires in ${daysLeft} days`}
      </Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "520px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "8px", padding: "32px", border: "1px solid #e5e7eb" }}>
          <Heading style={{ color: "#111827", fontSize: "20px", marginBottom: "4px" }}>
            TuneGuard License Alert
          </Heading>
          <Text style={{ color: "#6b7280", marginTop: 0 }}>Hi {userName},</Text>

          <Section style={{ backgroundColor: isExpired ? "#fee2e2" : "#fef3c7", borderRadius: "6px", padding: "16px", margin: "20px 0", borderLeft: `4px solid ${color}` }}>
            <Text style={{ margin: 0, fontWeight: "600", color: isExpired ? "#991b1b" : "#92400e" }}>
              {isExpired ? "License EXPIRED" : `License expiring in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
            </Text>
            <Text style={{ margin: "8px 0 0", color: isExpired ? "#7f1d1d" : "#78350f" }}>
              <strong>"{trackTitle}"</strong> by {artist}
              <br />
              Platform: {platformLabel(platform)}
              <br />
              {isExpired ? "Expired" : "Expires"}: {expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </Section>

          <Text style={{ color: "#374151" }}>
            {isExpired
              ? "This license has expired. Videos using this track may already be receiving copyright claims. Take action now to protect your revenue."
              : "This track is used in your YouTube videos. If your license expires without renewal, videos using this track may receive copyright claims."}
          </Text>

          <Hr style={{ borderColor: "#e5e7eb" }} />
          <Text style={{ color: "#9ca3af", fontSize: "12px" }}>
            TuneGuard — YouTube Music License Tracker
            <br />
            To manage alerts, visit your dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default LicenseExpiryWarning
