"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ConnectChannelButton() {
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      const res = await fetch("/api/channels", { method: "POST" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? "Failed to connect channel")
        return
      }
      // Reload to show the new channel
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={handleConnect} disabled={loading}>
      {loading ? "Connecting…" : "Connect Channel"}
    </Button>
  )
}
