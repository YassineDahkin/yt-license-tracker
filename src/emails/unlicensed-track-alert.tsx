import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components"

interface UnlicensedTrackAlertProps {
  userName: string
  trackTitle: string
  artist: string
  videoTitle: string
  youtubeVideoId: string
}

export function UnlicensedTrackAlert({
  userName,
  trackTitle,
  artist,
  videoTitle,
  youtubeVideoId,
}: UnlicensedTrackAlertProps) {
  const studioUrl = `https://studio.youtube.com/video/${youtubeVideoId}/edit`

  return (
    <Html>
      <Head />
      <Preview>Unlicensed music detected in "{videoTitle}" — action may be needed</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "520px", margin: "40px auto", backgroundColor: "#fff", borderRadius: "8px", padding: "32px", border: "1px solid #e5e7eb" }}>
          <Heading style={{ color: "#111827", fontSize: "20px", marginBottom: "4px" }}>
            TuneGuard — Unlicensed Track Detected
          </Heading>
          <Text style={{ color: "#6b7280", marginTop: 0 }}>Hi {userName},</Text>

          <Section style={{ backgroundColor: "#fef9c3", borderRadius: "6px", padding: "16px", margin: "20px 0", borderLeft: "4px solid #ca8a04" }}>
            <Text style={{ margin: 0, fontWeight: "600", color: "#713f12" }}>
              Music detected with no matching license
            </Text>
            <Text style={{ margin: "8px 0 0", color: "#78350f" }}>
              <strong>"{trackTitle}"</strong> by {artist}
              <br />
              Found in: <strong>{videoTitle}</strong>
            </Text>
          </Section>

          <Section style={{ backgroundColor: "#f0fdf4", borderRadius: "6px", padding: "16px", margin: "16px 0", borderLeft: "4px solid #16a34a" }}>
            <Text style={{ margin: 0, fontWeight: "600", color: "#14532d", fontSize: "13px" }}>
              This is a Content ID claim risk — NOT a copyright strike.
            </Text>
            <Text style={{ margin: "6px 0 0", color: "#166534", fontSize: "13px" }}>
              Your channel is safe. Only this video's monetization may be affected if a claim is filed.
            </Text>
          </Section>

          <Text style={{ color: "#374151", fontSize: "14px" }}>
            <strong>Your options:</strong>
          </Text>
          <Text style={{ color: "#374151", fontSize: "14px", margin: "4px 0" }}>
            1. If you have a license — upload your CSV to TuneGuard to clear this warning.
          </Text>
          <Text style={{ color: "#374151", fontSize: "14px", margin: "4px 0" }}>
            2. Replace the audio in YouTube Studio (keeps all views, comments, watch time).
          </Text>
          <Text style={{ color: "#374151", fontSize: "14px", margin: "4px 0" }}>
            3. Accept the claim if the video has low traffic — no channel penalty.
          </Text>

          <Link
            href={studioUrl}
            style={{ display: "inline-block", marginTop: "16px", backgroundColor: "#1d4ed8", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontSize: "14px" }}
          >
            Open in YouTube Studio
          </Link>

          <Hr style={{ borderColor: "#e5e7eb", marginTop: "24px" }} />
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

export default UnlicensedTrackAlert
