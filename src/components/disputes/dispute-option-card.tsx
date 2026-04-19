"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { DisputeOption } from "@/lib/dispute-generator"

interface DisputeOptionCardProps {
  option: DisputeOption
  rank: number
}

const CONFIDENCE_COLORS = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-red-100 text-red-800 border-red-200",
}

export function DisputeOptionCard({ option, rank }: DisputeOptionCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(option.templateText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-sm">
            {rank}
          </span>
          <div className="flex-1">
            <CardTitle className="text-base">{option.title}</CardTitle>
          </div>
          <Badge variant="outline" className={CONFIDENCE_COLORS[option.confidence]}>
            {option.confidence} confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/70">{option.description}</p>

        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">
            {option.templateText}
          </pre>
        </div>

        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-xs text-yellow-800">{option.disclaimer}</p>
        </div>

        <Button variant="outline" className="w-full" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy dispute text"}
        </Button>
      </CardContent>
    </Card>
  )
}
