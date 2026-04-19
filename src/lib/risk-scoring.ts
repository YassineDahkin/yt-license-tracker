// Risk priority: EXPIRED > AT_RISK > SAFE > UNKNOWN
// AT_RISK threshold: license expires within 30 days

export type RiskLevel = "SAFE" | "AT_RISK" | "EXPIRED" | "UNKNOWN"

const RISK_PRIORITY: Record<RiskLevel, number> = {
  EXPIRED: 3,
  AT_RISK: 2,
  SAFE: 1,
  UNKNOWN: 0,
}

export function trackRiskLevel(expiresAt: Date | null | undefined): RiskLevel {
  if (expiresAt === undefined) return "UNKNOWN"
  if (expiresAt === null) return "SAFE" // perpetual license

  const now = new Date()
  if (expiresAt < now) return "EXPIRED"

  const daysLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysLeft <= 30) return "AT_RISK"

  return "SAFE"
}

export function worstRisk(levels: RiskLevel[]): RiskLevel {
  if (levels.length === 0) return "UNKNOWN"
  return levels.reduce((worst, current) =>
    RISK_PRIORITY[current] > RISK_PRIORITY[worst] ? current : worst,
  )
}
