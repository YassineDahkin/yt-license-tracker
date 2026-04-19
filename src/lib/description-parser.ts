export interface ParsedTrack {
  title: string
  artist: string
  platform: "EPIDEMIC_SOUND" | "ARTLIST" | "OTHER"
}

const PATTERNS: Array<{
  platform: ParsedTrack["platform"]
  regex: RegExp
  titleGroup: number
  artistGroup: number
}> = [
  // Epidemic Sound: "Song Title" by Artist Name [Epidemic Sound]
  {
    platform: "EPIDEMIC_SOUND",
    regex: /"([^"]+)"\s+by\s+([^\[\n]+)\s*\[?Epidemic Sound\]?/gi,
    titleGroup: 1,
    artistGroup: 2,
  },
  // Epidemic Sound: Music: Song Title - Artist (Epidemic Sound)
  {
    platform: "EPIDEMIC_SOUND",
    regex: /Music:\s*([^-\n]+)\s*-\s*([^\n(]+)\s*\(?Epidemic Sound\)?/gi,
    titleGroup: 1,
    artistGroup: 2,
  },
  // Artlist: "Song Title" by Artist - Artlist
  {
    platform: "ARTLIST",
    regex: /"([^"]+)"\s+by\s+([^\-\n]+)\s*[-–]\s*Artlist/gi,
    titleGroup: 1,
    artistGroup: 2,
  },
  // Artlist: Music: Song Title - Artist (Artlist)
  {
    platform: "ARTLIST",
    regex: /Music:\s*([^-\n]+)\s*-\s*([^\n(]+)\s*\(?Artlist\)?/gi,
    titleGroup: 1,
    artistGroup: 2,
  },
  // Generic: Music by Artist - Song Title
  {
    platform: "OTHER",
    regex: /Music by\s+([^\n\-]+)\s*[-–]\s*"?([^"\n]+)"?/gi,
    titleGroup: 2,
    artistGroup: 1,
  },
]

export function parseTracksFromDescription(description: string): ParsedTrack[] {
  if (!description) return []

  const results: ParsedTrack[] = []
  const seen = new Set<string>()

  for (const { platform, regex, titleGroup, artistGroup } of PATTERNS) {
    // Reset lastIndex for global regexes
    regex.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(description)) !== null) {
      const title = match[titleGroup]?.trim()
      const artist = match[artistGroup]?.trim()
      if (!title || !artist) continue
      const key = `${title.toLowerCase()}::${artist.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ title, artist, platform })
    }
  }

  return results
}
