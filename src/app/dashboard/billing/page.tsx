import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PricingTable } from "@/components/billing/pricing-table"
import { type PlanKey } from "@/lib/stripe"

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams

  const sub = await db.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true, status: true, currentPeriodEnd: true },
  })

  const currentPlan = (sub?.plan ?? "FREE") as PlanKey

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Current plan: <strong>{currentPlan}</strong>
          {sub?.currentPeriodEnd && (
            <span className="ml-2 text-sm">
              · renews {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          )}
        </p>
      </div>

      {params.success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          Subscription activated! Your plan has been upgraded.
        </div>
      )}
      {params.cancelled && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
          Checkout cancelled. No charge was made.
        </div>
      )}

      <PricingTable currentPlan={currentPlan} />
    </div>
  )
}
