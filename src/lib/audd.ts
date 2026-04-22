import { spawn } from "child_process"
import { existsSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

const AUDD_API_URL = "https://api.audd.io/"
const MAX_AUDIO_BYTES = 800 * 1024
const SCAN_OFFSETS = [0, 30, 60, 90, 120, 150]

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

// Download full audio to a temp file — returns path or null on failure
function downloadAudioToFile(youtubeVideoId: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ytdlp = spawn("yt-dlp", [
      "-f", "bestaudio",
      "-o", destPath,
      "--quiet",
      "--no-playlist",
      `https://www.youtube.com/watch?v=${youtubeVideoId}`,
    ])

    const timer = setTimeout(() => { ytdlp.kill(); resolve(false) }, 120_000)

    ytdlp.on("close", (code) => {
      clearTimeout(timer)
      resolve(code === 0 && existsSync(destPath))
    })

    ytdlp.on("error", () => { clearTimeout(timer); resolve(false) })
  })
}

// Extract a 20s segment from a local file at `offsetSeconds` via ffmpeg
function extractSegmentFromFile(filePath: string, offsetSeconds: number): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    let totalBytes = 0
    let settled = false

    function done(result: Buffer | null) {
      if (settled) return
      settled = true
      resolve(result)
    }

    // Input seek (-ss before -i) is fast on files — no full decode needed
    const ff = spawn("ffmpeg", [
      "-v", "quiet",
      "-ss", String(offsetSeconds),
      "-i", filePath,
      "-t", "20",
      "-f", "webm",
      "pipe:1",
    ])

    const timer = setTimeout(() => { ff.kill(); done(totalBytes >= 1000 ? Buffer.concat(chunks) : null) }, 30_000)

    ff.stdout.on("data", (chunk: Buffer) => {
      if (totalBytes >= MAX_AUDIO_BYTES) { ff.kill(); return }
      chunks.push(chunk)
      totalBytes += chunk.length
    })

    ff.on("close", () => {
      clearTimeout(timer)
      done(totalBytes >= 1000 ? Buffer.concat(chunks) : null)
    })

    ff.on("error", () => { clearTimeout(timer); done(null) })
    ff.stderr.on("data", () => {})
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

// Download once, sample 4 offsets — return first recognition hit
export async function recognizeMusicInVideo(
  youtubeVideoId: string,
): Promise<(AudDTrack & { isrc?: string }) | null> {
  if (!process.env.AUDD_API_KEY) return null

  const tmpPath = join(tmpdir(), `tuneguard-${youtubeVideoId}-${Date.now()}`)

  try {
    const downloaded = await downloadAudioToFile(youtubeVideoId, tmpPath)
    if (!downloaded) return null

    for (const offset of SCAN_OFFSETS) {
      const buf = await extractSegmentFromFile(tmpPath, offset)
      if (!buf) continue
      const result = await recognizeBuffer(process.env.AUDD_API_KEY, buf)
      if (result) return result
    }

    return null
  } finally {
    // Clean up temp file regardless of outcome
    try { if (existsSync(tmpPath)) unlinkSync(tmpPath) } catch {}
  }
}
