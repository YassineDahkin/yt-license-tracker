export interface ParsedLicense {
  title: string
  artist: string
  isrc: string | null
  expiresAt: Date | null  // null = perpetual (pre-2021 licenses)
  purchasedAt: Date | null
  platform: "ARTLIST"
}

// Artlist CSV headers (as of 2024):
// "Song", "Artist", "ISRC", "License", "License Date", "Expiry Date"
// Pre-2021 licenses are perpetual (no expiry). Post-2021 subscription licenses expire.

export function parseArtlistCsv(rows: Record<string, string>[]): ParsedLicense[] {
  return rows
    .filter((row) => {
      const title = row["Song"] ?? row["song"] ?? row["Title"] ?? row["Track"] ?? ""
      return title.trim().length > 0
    })
    .map((row) => {
      const title =
        (row["Song"] ?? row["song"] ?? row["Title"] ?? row["Track"] ?? "").trim()
      const artist =
        (row["Artist"] ?? row["artist"] ?? row["Composer"] ?? "").trim()
      const isrc =
        (row["ISRC"] ?? row["isrc"] ?? "").trim() || null
      const purchasedAt = parseDate(
        row["License Date"] ?? row["license_date"] ?? row["Date"] ?? "",
      )
      const expiresAt = parseDate(
        row["Expiry Date"] ?? row["expiry_date"] ?? row["Expiration Date"] ?? "",
      )

      return {
        title,
        artist,
        isrc,
        expiresAt,  // null = perpetual
        purchasedAt,
        platform: "ARTLIST" as const,
      }
    })
    .filter((l) => l.title && l.artist)
}

function parseDate(raw: string): Date | null {
  if (!raw?.trim()) return null
  const d = new Date(raw.trim())
  return isNaN(d.getTime()) ? null : d
}
