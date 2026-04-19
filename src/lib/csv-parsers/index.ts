import { parseEpidemicSoundCsv } from "./epidemic-sound"
import { parseArtlistCsv } from "./artlist"

export type { ParsedLicense as EpidemicParsedLicense } from "./epidemic-sound"
export type { ParsedLicense as ArtlistParsedLicense } from "./artlist"

export interface UnifiedLicense {
  title: string
  artist: string
  isrc: string | null
  expiresAt: Date | null
  purchasedAt: Date | null
  platform: "EPIDEMIC_SOUND" | "ARTLIST"
}

type DetectedPlatform = "EPIDEMIC_SOUND" | "ARTLIST" | null

function detectPlatform(headers: string[]): DetectedPlatform {
  const h = headers.map((s) => s.toLowerCase())
  if (h.some((s) => s.includes("track title") || s.includes("track_title"))) {
    return "EPIDEMIC_SOUND"
  }
  if (h.some((s) => s === "song" || s.includes("expiry date") || s.includes("expiry_date"))) {
    return "ARTLIST"
  }
  // Fallback heuristics
  if (h.includes("song") || h.includes("expiry date")) return "ARTLIST"
  if (h.includes("track title") || h.includes("license date")) return "EPIDEMIC_SOUND"
  return null
}

export function parseLicenseCsv(
  rows: Record<string, string>[],
  forcePlatform?: "EPIDEMIC_SOUND" | "ARTLIST",
  epidemicRenewalDate?: Date,
): { licenses: UnifiedLicense[]; platform: DetectedPlatform; error?: string } {
  if (rows.length === 0) {
    return { licenses: [], platform: null, error: "CSV is empty" }
  }

  const headers = Object.keys(rows[0])
  const platform = forcePlatform ?? detectPlatform(headers)

  if (!platform) {
    return {
      licenses: [],
      platform: null,
      error: `Could not detect CSV format. Headers found: ${headers.join(", ")}. Expected Epidemic Sound or Artlist format.`,
    }
  }

  if (platform === "EPIDEMIC_SOUND") {
    const parsed = parseEpidemicSoundCsv(rows)
    return {
      platform,
      licenses: parsed.map((l) => ({
        ...l,
        expiresAt: epidemicRenewalDate ?? null,
      })),
    }
  }

  // ARTLIST
  const parsed = parseArtlistCsv(rows)
  return {
    platform,
    licenses: parsed.map((l) => ({ ...l })),
  }
}
