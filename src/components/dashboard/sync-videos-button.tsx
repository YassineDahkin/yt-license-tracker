"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function SyncVideosButton({ channelId }: { channelId: string }) {
  const [state, setState] = useState<"idle" | "syncing" | "done" | "error">("idle")
  const [count, setCount] = useState<number | null>(null)

  async function handleSync() {
    setState("syncing")
    try {
      const res = await fetch(`/api/channels/${channelId}/videos`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        console.error(data)
        setState("error")
        return
      }
      setCount(data.imported)
      setState("done")
      // Reload to update video count
      setTimeout(() => window.location.reload(), 1000)
    } catch (e) {
      console.error(e)
      setState("error")
    }
  }

  if (state === "done") return <span className="text-sm text-green-600">✓ {count} videos imported</span>
  if (state === "error") return <span className="text-sm text-red-600">Sync failed — check console</span>

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSync}
      disabled={state === "syncing"}
    >
      {state === "syncing" ? "Syncing…" : "Sync Videos"}
    </Button>
  )
}
