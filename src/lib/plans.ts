export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    videoLimit: 50,
    channelLimit: 1,
    hasDisputeAssistant: false,
    priceId: null,
  },
  CREATOR: {
    name: "Creator",
    price: 19,
    videoLimit: Infinity,
    channelLimit: 1,
    hasDisputeAssistant: true,
    priceId: process.env.STRIPE_CREATOR_PRICE_ID ?? "",
  },
  PRO: {
    name: "Pro",
    price: 49,
    videoLimit: Infinity,
    channelLimit: 3,
    hasDisputeAssistant: true,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  },
} as const

export type PlanKey = keyof typeof PLANS
