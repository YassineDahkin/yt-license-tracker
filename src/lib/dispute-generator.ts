export interface DisputeOption {
  id: string
  title: string
  confidence: "high" | "medium" | "low"
  description: string
  templateText: string
  disclaimer: string
}

interface DisputeContext {
  trackTitle: string
  artist: string
  platform: string
  videoTitle: string
  hasValidLicense: boolean
  licenseType?: string
  purchasedAt?: Date
}

const DISCLAIMER = "⚠️ Not legal advice. Review with a qualified professional before submitting."

function platformLabel(p: string) {
  switch (p) {
    case "EPIDEMIC_SOUND": return "Epidemic Sound"
    case "ARTLIST": return "Artlist"
    case "MUSICBED": return "Musicbed"
    case "POND5": return "Pond5"
    default: return p
  }
}

export function generateDisputeOptions(ctx: DisputeContext): DisputeOption[] {
  const options: DisputeOption[] = []
  const platform = platformLabel(ctx.platform)

  if (ctx.hasValidLicense) {
    options.push({
      id: "license-proof",
      title: "Submit License Proof",
      confidence: "high",
      description: `You have a valid ${platform} license for this track. Strongest dispute — attach your license certificate or order confirmation.`,
      templateText: `I am disputing this copyright claim for the video "${ctx.videoTitle}".

I have a valid license for the track "${ctx.trackTitle}" by ${ctx.artist}, purchased through ${platform}${ctx.purchasedAt ? ` on ${ctx.purchasedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}` : ""}.

This license grants me rights to use this music in YouTube content. I am attaching proof of license below.

License platform: ${platform}
Track: "${ctx.trackTitle}" by ${ctx.artist}

Please review and release this claim.`,
      disclaimer: DISCLAIMER,
    })
  }

  options.push({
    id: "subscription-claim",
    title: "Subscription License Claim",
    confidence: "medium",
    description: `Claim coverage under your ${platform} subscription. Works if subscription was active at upload date — be ready to provide account details.`,
    templateText: `I am disputing this copyright claim for the video "${ctx.videoTitle}".

The track "${ctx.trackTitle}" by ${ctx.artist} was used under my active ${platform} subscription license at the time of upload. ${platform} subscriptions grant unlimited licenses for content created during the subscription period.

My ${platform} account is registered and in good standing. I can provide account verification upon request.

Please review and release this claim.`,
    disclaimer: DISCLAIMER,
  })

  options.push({
    id: "fair-use",
    title: "Fair Use Dispute",
    confidence: "low",
    description: "Last resort. Only use if you have no license. Fair use is context-dependent and not guaranteed — consult a lawyer first.",
    templateText: `I am disputing this copyright claim for the video "${ctx.videoTitle}".

My use of "${ctx.trackTitle}" by ${ctx.artist} constitutes fair use under 17 U.S.C. § 107 because:
- The use is transformative in nature
- Only a brief portion of the work was used
- The use does not substitute for or harm the market for the original work
- The purpose is [educational / commentary / criticism — edit as appropriate]

Please review and release this claim.`,
    disclaimer: DISCLAIMER,
  })

  return options
}
