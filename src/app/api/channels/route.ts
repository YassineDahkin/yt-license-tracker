import { auth } from "@/auth"
import { db } from "@/lib/db"
import { fetchMyChannel } from "@/lib/youtube"
import { NextResponse } from "next/server"

/**
 * POST /api/channels
 * Connect the authenticated user's YouTube channel.
 * Fetches channel info from YouTube Data API using the stored OAuth token.
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await db.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  })

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No Google access token found. Please sign out and sign in again." },
      { status: 400 },
    )
  }

  const channelInfo = await fetchMyChannel(account.access_token)
  if (!channelInfo) {
    return NextResponse.json(
      { error: "No YouTube channel found on this Google account." },
      { status: 404 },
    )
  }

  const channel = await db.channel.upsert({
    where: { youtubeChannelId: channelInfo.youtubeChannelId },
    update: {
      title: channelInfo.title,
      thumbnailUrl: channelInfo.thumbnailUrl,
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
    },
    create: {
      userId: session.user.id,
      ...channelInfo,
    },
  })

  return NextResponse.json({ channel })
}

/**
 * GET /api/channels
 * List all channels connected by the authenticated user.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const channels = await db.channel.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { videos: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ channels })
}
