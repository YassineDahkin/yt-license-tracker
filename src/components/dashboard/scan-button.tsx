"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface ScanProgress {
  total: number
  completed: number
  scanning: number
  pending: number
  failed: number
}

export function ScanButton({ channelId, videoCount }: { channelId: string; videoCount: number }) {
  const [state, setState] = useState<"idle" | "queued" | "scanning" | "done" | "error">("idle")
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  const [stallMessage, setStallMessage] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCompletedRef = useRef<number>(-1)
  const stalledSinceRef = useRef<number | null>(null)
  const STALL_TIMEOUT_MS = 90_000 // 90s no progress → give up

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function pollProgress() {
    const res = await fetch(`/api/scans?channelId=${channelId}`)
    if (!res.ok) return
    const data: ScanProgress = await res.json()
    setProgress(data)

    const inProgress = data.scanning + data.pending
    if (inProgress === 0 && data.completed + data.failed === data.total && data.total > 0) {
      setState("done")
      stopPolling()
      setTimeout(() => window.location.reload(), 1500)
      return
    }

    // Stall detection: if completed count hasn't changed for STALL_TIMEOUT_MS, stop
    if (data.completed !== lastCompletedRef.current) {
      lastCompletedRef.current = data.completed
      stalledSinceRef.current = null
    } else {
      if (stalledSinceRef.current === null) {
        stalledSinceRef.current = Date.now()
      } else if (Date.now() - stalledSinceRef.current > STALL_TIMEOUT_MS) {
        stopPolling()
        setState("done")
        setStallMessage(`Scan stalled — ${data.completed}/${data.total} done. Click again to retry remaining.`)
        // Mark stuck SCANNING videos as PENDING so next scan picks them up
        await fetch("/api/scans/reset-stuck", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId }) })
        setTimeout(() => window.location.reload(), 1000)
      }
    }
  }

  useEffect(() => () => stopPolling(), [])

  async function handleScan() {
    setState("queued")
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? "Failed to start scan")
        setState("idle")
        return
      }
      setState("scanning")
      // Poll every 2 seconds
      pollRef.current = setInterval(pollProgress, 2000)
    } catch {
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <span className="text-sm text-green-600">
        {stallMessage || "✓ Scan complete"}
      </span>
    )
  }

  if (state === "scanning" || state === "queued") {
    // Count scanning videos as half-done so the bar moves during active scans
    const pct = progress && progress.total > 0
      ? Math.min(99, Math.round(((progress.completed + progress.scanning * 0.5) / progress.total) * 100))
      : null

    const label = progress
      ? progress.scanning > 0
        ? `${progress.completed}/${progress.total} · ${progress.scanning} active`
        : `${progress.completed}/${progress.total}`
      : "Starting…"

    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-700"
            style={{ width: pct !== null ? `${pct}%` : "5%" }}
          />
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={handleScan}>
      Scan Music ({videoCount})
    </Button>
  )
}
