import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { stripe, PLANS, PlanKey } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { plan } = await req.json() as { plan: PlanKey }

  if (plan === "FREE" || !PLANS[plan]?.priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  // Get or create Stripe customer
  let sub = await db.subscription.findUnique({ where: { userId: session.user.id } })

  let customerId = sub?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id

    // Upsert subscription record
    await db.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        stripeCustomerId: customerId,
        plan: "FREE",
        status: "ACTIVE",
      },
      update: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?cancelled=1`,
    metadata: { userId: session.user.id, plan },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
