"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PLANS, PlanKey } from "@/lib/plans"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const FEATURES: Record<PlanKey, string[]> = {
  FREE: [
    "Up to 50 videos",
    "1 YouTube channel",
    "Music detection (AudD)",
    "License CSV upload",
    "Email alerts",
  ],
  CREATOR: [
    "Unlimited videos",
    "1 YouTube channel",
    "Music detection (AudD)",
    "License CSV upload",
    "Email alerts",
    "Dispute assistant",
  ],
  PRO: [
    "Unlimited videos",
    "Up to 3 YouTube channels",
    "Music detection (AudD)",
    "License CSV upload",
    "Email alerts",
    "Dispute assistant",
    "Priority support",
  ],
}

interface PricingTableProps {
  currentPlan: PlanKey
}

export function PricingTable({ currentPlan }: PricingTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<PlanKey | null>(null)

  async function handleUpgrade(plan: PlanKey) {
    if (plan === "FREE") return
    setLoading(plan)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading("FREE")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => {
        const isCurrent = key === currentPlan
        const isPopular = key === "CREATOR"

        return (
          <Card key={key} className={`relative flex flex-col ${isCurrent ? "border-blue-500 border-2" : ""} ${isPopular ? "shadow-lg" : ""}`}>
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                {isCurrent && <Badge variant="outline">Current</Badge>}
              </CardTitle>
              <div className="text-3xl font-bold">
                {plan.price === 0 ? "Free" : `$${plan.price}`}
                {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {FEATURES[key].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isCurrent ? (
                currentPlan !== "FREE" ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePortal}
                    disabled={loading !== null}
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                )
              ) : key === "FREE" ? null : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(key)}
                  disabled={loading !== null}
                >
                  {loading === key ? "Redirecting..." : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
