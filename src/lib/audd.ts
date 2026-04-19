import { spawn } from "child_process"

const AUDD_API_URL = "https://api.audd.io/"
const MAX_AUDIO_BYTES = 800 * 1024 // ~15s of opus audio

export interface AudDTrack {
  title: string
  artist: string
  album: string
  release_date: string
  label: string
  timecode: string
  song_link: string
  isrc?: string
}

interface AudDResponse {
  status: "success" | "error"
  result: (AudDTrack & {
    apple_music?: { isrc: string }
    spotify?: { external_ids: { isrc: string } }
  }) | null
  error?: { error_code: number; error_message: string }
}

// Sample a 20-second window at `offsetSeconds` into the video via ffmpeg pipe
function downloadAudioAtOffset(youtubeVideoId: string, offsetSeconds: number): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    let totalBytes = 0
    let settled = false

    function done(result: Buffer | null) {
      if (settled) return
      settled = true
      resolve(result)
    }

    // yt-dlp pipes raw audio → ffmpeg seeks to offset, extracts 20s, outputs webm to stdout
    const ytdlp = spawn("yt-dlp", [
      "-f", "bestaudio",
      "-o", "-",
      "--quiet",
      `https://www.youtube.com/watch?v=${youtubeVideoId}`,
    ])

    const ff = spawn("ffmpeg", [
      "-v", "quiet",
      "-i", "pipe:0",
      "-ss", String(offsetSeconds),
      "-t", "20",
      "-f", "webm",
      "pipe:1",
    ])

    ytdlp.stdout.pipe(ff.stdin)
    ytdlp.on("error", () => done(null))
    ytdlp.stderr.on("data", () => {}) // suppress

    const timer = setTimeout(() => {
      ytdlp.kill(); ff.kill()
      done(totalBytes >= 1000 ? Buffer.concat(chunks) : null)
    }, 45_000)

    ff.stdout.on("data", (chunk: Buffer) => {
      if (totalBytes >= MAX_AUDIO_BYTES) { ytdlp.kill(); ff.kill(); return }
      chunks.push(chunk)
      totalBytes += chunk.length
    })

    ff.stderr.on("data", () => {}) // suppress

    ff.on("close", () => {
      clearTimeout(timer)
      ytdlp.kill()
      done(totalBytes >= 1000 ? Buffer.concat(chunks) : null)
    })

    ff.on("error", () => {
      clearTimeout(timer)
      ytdlp.kill()
      done(null)
    })
  })
}

async function recognizeBuffer(apiKey: string, buf: Buffer): Promise<(AudDTrack & { isrc?: string }) | null> {
  const form = new FormData()
  form.append("api_token", apiKey)
  form.append("return", "apple_music,spotify")
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  form.append("file", new Blob([ab]), "audio.webm")

  const res = await fetch(AUDD_API_URL, { method: "POST", body: form })
  if (!res.ok) return null

  const data: AudDResponse = await res.json()
  if (data.status !== "success" || !data.result) return null

  const isrc =
    data.result.apple_music?.isrc ??
    data.result.spotify?.external_ids?.isrc ??
    undefined

  return { ...data.result, isrc }
}

// Try 4 time windows: 0s, 30s, 60s, 90s — return first recognition hit
const SCAN_OFFSETS = [0, 30, 60, 90]

export async function recognizeMusicInVideo(
  youtubeVideoId: string,
): Promise<(AudDTrack & { isrc?: string }) | null> {
  if (!process.env.AUDD_API_KEY) return null

  for (const offset of SCAN_OFFSETS) {
    const buf = await downloadAudioAtOffset(youtubeVideoId, offset)
    if (!buf) continue
    const result = await recognizeBuffer(process.env.AUDD_API_KEY, buf)
    if (result) return result
  }

  return null
}
