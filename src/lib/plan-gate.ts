import { db } from "@/lib/db"
import { PLANS, PlanKey } from "@/lib/stripe"

export class PlanGateError extends Error {
  constructor(
    public readonly feature: string,
    public readonly requiredPlan: PlanKey,
  ) {
    super(`${feature} requires ${requiredPlan} plan or higher`)
    this.name = "PlanGateError"
  }
}

export async function getUserPlan(userId: string): Promise<PlanKey> {
  const sub = await db.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  })
  if (!sub || sub.status === "CANCELLED") return "FREE"
  return sub.plan as PlanKey
}

export async function assertVideoLimit(userId: string): Promise<void> {
  const plan = await getUserPlan(userId)
  const limit = PLANS[plan].videoLimit
  if (limit === Infinity) return

  const count = await db.video.count({
    where: { channel: { userId } },
  })
  if (count >= limit) {
    throw new PlanGateError(`Scanning more than ${limit} videos`, "CREATOR")
  }
}

export async function assertDisputeAccess(userId: string): Promise<void> {
  const plan = await getUserPlan(userId)
  if (!PLANS[plan].hasDisputeAssistant) {
    throw new PlanGateError("Dispute assistant", "CREATOR")
  }
}
