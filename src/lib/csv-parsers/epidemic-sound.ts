export interface ParsedLicense {
  title: string
  artist: string
  isrc: string | null
  expiresAt: Date | null  // null = subscription renews
  purchasedAt: Date | null
  platform: "EPIDEMIC_SOUND"
}

// Epidemic Sound CSV headers (as of 2024):
// "Track Title", "Artist", "ISRC", "License Type", "License Date"
// Subscription-based — no per-track expiry. expiresAt set from caller (subscription renewal date).

export function parseEpidemicSoundCsv(rows: Record<string, string>[]): ParsedLicense[] {
  return rows
    .filter((row) => {
      const title = row["Track Title"] ?? row["track_title"] ?? row["Title"] ?? ""
      return title.trim().length > 0
    })
    .map((row) => {
      const title =
        (row["Track Title"] ?? row["track_title"] ?? row["Title"] ?? "").trim()
      const artist =
        (row["Artist"] ?? row["artist"] ?? row["Artist Name"] ?? "").trim()
      const isrc =
        (row["ISRC"] ?? row["isrc"] ?? "").trim() || null
      const licenseDateRaw =
        row["License Date"] ?? row["license_date"] ?? row["Date"] ?? ""
      const purchasedAt = parseDate(licenseDateRaw)

      return {
        title,
        artist,
        isrc,
        expiresAt: null, // subscription — caller sets renewal date
        purchasedAt,
        platform: "EPIDEMIC_SOUND" as const,
      }
    })
    .filter((l) => l.title && l.artist)
}

function parseDate(raw: string): Date | null {
  if (!raw?.trim()) return null
  const d = new Date(raw.trim())
  return isNaN(d.getTime()) ? null : d
}
