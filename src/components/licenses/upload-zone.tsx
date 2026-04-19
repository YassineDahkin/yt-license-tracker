"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function UploadZone() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [platform, setPlatform] = useState<"auto" | "EPIDEMIC_SOUND" | "ARTLIST">("auto")
  const [epidemicRenewalDate, setEpidemicRenewalDate] = useState("")
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith(".csv")) setFile(dropped)
  }

  async function handleUpload() {
    if (!file) return
    setStatus("uploading")
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)
    if (epidemicRenewalDate) formData.append("epidemicRenewalDate", epidemicRenewalDate)

    try {
      const res = await fetch("/api/licenses", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "Upload failed")
        return
      }
      setStatus("done")
      setMessage(`Saved ${data.saved} licenses from ${data.platform === "EPIDEMIC_SOUND" ? "Epidemic Sound" : "Artlist"}. Scoring videos in background…`)
      setFile(null)
      router.refresh()
    } catch {
      setStatus("error")
      setMessage("Network error. Try again.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload License CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <p className="text-sm font-medium text-gray-700">{file.name}</p>
          ) : (
            <>
              <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">Drop CSV here or click to browse</p>
              <p className="mt-1 text-xs text-gray-400">Epidemic Sound or Artlist format</p>
            </>
          )}
        </div>

        {/* Epidemic Sound renewal date (only if ES selected or auto) */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Epidemic Sound renewal date (optional)
            </label>
            <input
              type="date"
              value={epidemicRenewalDate}
              onChange={(e) => setEpidemicRenewalDate(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              When your Epidemic Sound subscription renews. All ES tracks treated as expiring on this date.
            </p>
          </div>
        </div>

        {/* Status */}
        {message && (
          <p className={`text-sm ${status === "error" ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          className="w-full"
        >
          {status === "uploading" ? "Uploading…" : "Upload Licenses"}
        </Button>
      </CardContent>
    </Card>
  )
}
