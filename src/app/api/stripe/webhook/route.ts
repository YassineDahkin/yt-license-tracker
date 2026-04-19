import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import type Stripe from "stripe"

// CRITICAL: raw body required for Stripe signature verification
export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan as "CREATOR" | "PRO" | undefined

      if (!userId || !plan) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      await db.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          plan,
          status: "ACTIVE",
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          plan,
          status: "ACTIVE",
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
      })
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const sub = await db.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      })
      if (!sub) break

      const status = subscription.status === "active" ? "ACTIVE"
        : subscription.status === "past_due" ? "PAST_DUE"
        : subscription.status === "trialing" ? "TRIALING"
        : "CANCELLED"

      await db.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status,
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
      })
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { plan: "FREE", status: "CANCELLED", stripeSubscriptionId: null },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
