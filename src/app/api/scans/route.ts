import { auth } from "@/auth"
import { db } from "@/lib/db"
import { inngest } from "@/inngest/client"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/scans
 * Trigger a bulk music scan for a channel.
 * Body: { channelId: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { channelId } = await req.json()
  if (!channelId) {
    return NextResponse.json({ error: "channelId required" }, { status: 400 })
  }

  // Verify channel belongs to user
  const channel = await db.channel.findFirst({
    where: { id: channelId, userId: session.user.id },
    include: { _count: { select: { videos: true } } },
  })
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  // Check free plan limit (50 videos)
  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
  })
  const plan = subscription?.plan ?? "FREE"
  if (plan === "FREE" && channel._count.videos > 50) {
    return NextResponse.json(
      { error: "Free plan limited to 50 videos. Upgrade to Creator." },
      { status: 402 },
    )
  }

  await inngest.send({
    name: "scan/channel.requested",
    data: { channelId, userId: session.user.id },
  })

  return NextResponse.json({ status: "queued", videos: channel._count.videos })
}

/**
 * GET /api/scans?channelId=xxx
 * Returns scan progress for a channel.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const channelId = req.nextUrl.searchParams.get("channelId")
  if (!channelId) {
    return NextResponse.json({ error: "channelId required" }, { status: 400 })
  }

  const counts = await db.video.groupBy({
    by: ["scanStatus"],
    where: { channelId, channel: { userId: session.user.id } },
    _count: true,
  })

  const statusMap = Object.fromEntries(
    counts.map((c) => [c.scanStatus, c._count]),
  )

  const total = Object.values(statusMap).reduce((a, b) => a + b, 0)
  const completed = statusMap["COMPLETED"] ?? 0
  const scanning = statusMap["SCANNING"] ?? 0
  const pending = statusMap["PENDING"] ?? 0
  const failed = statusMap["FAILED"] ?? 0

  return NextResponse.json({ total, completed, scanning, pending, failed })
}
