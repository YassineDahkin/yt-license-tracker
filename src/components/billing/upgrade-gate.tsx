"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UpgradeGateProps {
  feature: string
  description?: string
}

export function UpgradeGate({ feature, description }: UpgradeGateProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="text-4xl mb-2">🔒</div>
          <CardTitle>{feature}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {description ?? `${feature} is available on Creator and Pro plans.`}
          </p>
          <Button onClick={() => router.push("/dashboard/billing")} className="w-full">
            Upgrade to unlock
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
