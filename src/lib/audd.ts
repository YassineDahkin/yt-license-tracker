import { spawn } from "child_process"
import { existsSync, readdirSync, unlinkSync } from "fs"
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

// Download full audio to temp file — returns actual path (with ext) or null
// yt-dlp auto-appends extension, so we use %(ext)s template and find the file afterward
function downloadAudioToFile(youtubeVideoId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const baseName = `tuneguard-${youtubeVideoId}-${Date.now()}`
    const template = join(tmpdir(), `${baseName}.%(ext)s`)
    const stderrLines: string[] = []

    const ytdlp = spawn("yt-dlp", [
      "-f", "bestaudio",
      "-o", template,
      "--no-playlist",
      "--js-runtimes", "node",
      `https://www.youtube.com/watch?v=${youtubeVideoId}`,
    ])

    ytdlp.stderr.on("data", (d: Buffer) => stderrLines.push(d.toString()))
    ytdlp.stdout.on("data", () => {})

    const timer = setTimeout(() => {
      ytdlp.kill()
      console.error(`[audd] yt-dlp timeout for ${youtubeVideoId}`)
      resolve(null)
    }, 120_000)

    ytdlp.on("close", (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        console.error(`[audd] yt-dlp exit ${code} for ${youtubeVideoId}:`, stderrLines.slice(-3).join(" "))
        resolve(null)
        return
      }
      try {
        const files = readdirSync(tmpdir()).filter(f => f.startsWith(baseName))
        console.log(`[audd] downloaded ${youtubeVideoId} → ${files[0] ?? "NOT FOUND"} (tmpdir=${tmpdir()})`)
        resolve(files.length > 0 ? join(tmpdir(), files[0]) : null)
      } catch (e) {
        console.error(`[audd] readdirSync failed:`, e)
        resolve(null)
      }
    })

    ytdlp.on("error", (e) => {
      clearTimeout(timer)
      console.error(`[audd] spawn error:`, e)
      resolve(null)
    })
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

  const tmpPath = await downloadAudioToFile(youtubeVideoId)

  try {
    if (!tmpPath) {
      console.error(`[audd] no file for ${youtubeVideoId}, skipping recognition`)
      return null
    }

    for (const offset of SCAN_OFFSETS) {
      const buf = await extractSegmentFromFile(tmpPath, offset)
      console.log(`[audd] offset=${offset}s buf=${buf ? buf.length : "null"} for ${youtubeVideoId}`)
      if (!buf) continue
      const result = await recognizeBuffer(process.env.AUDD_API_KEY, buf)
      console.log(`[audd] AudD result offset=${offset}s:`, result ? `${result.artist} - ${result.title}` : "null")
      if (result) return result
    }

    return null
  } finally {
    try { if (tmpPath && existsSync(tmpPath)) unlinkSync(tmpPath) } catch {}
  }
}
