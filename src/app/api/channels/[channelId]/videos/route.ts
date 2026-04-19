import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  fetchAllVideoIds,
  fetchVideoDetails,
  getUploadsPlaylistId,
} from "@/lib/youtube"
import { chunk } from "@/lib/utils"
import { getFreshAccessToken } from "@/lib/token"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  _req: NextRequest,
  { params }: { params: { channelId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const channel = await db.channel.findFirst({
    where: { id: params.channelId, userId: session.user.id },
  })
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  const accessToken = await getFreshAccessToken(session.user.id)
  if (!accessToken) {
    return NextResponse.json({ error: "No access token — sign out and sign in again" }, { status: 400 })
  }

  const uploadsPlaylistId = await getUploadsPlaylistId(accessToken, channel.youtubeChannelId)
  if (!uploadsPlaylistId) {
    return NextResponse.json({ error: "Could not find uploads playlist" }, { status: 500 })
  }

  const videoIds = await fetchAllVideoIds(accessToken, uploadsPlaylistId)

  let totalImported = 0
  for (const batch of chunk(videoIds, 50)) {
    const details = await fetchVideoDetails(accessToken, batch)

    for (const video of details) {
      await db.video.upsert({
        where: { youtubeVideoId: video.id! },
        update: {
          title: video.snippet?.title ?? "",
          description: video.snippet?.description ?? null,
          viewCount: Number(video.statistics?.viewCount ?? 0),
          thumbnailUrl: video.snippet?.thumbnails?.medium?.url ?? null,
        },
        create: {
          channelId: channel.id,
          youtubeVideoId: video.id!,
          title: video.snippet?.title ?? "",
          description: video.snippet?.description ?? null,
          publishedAt: video.snippet?.publishedAt ? new Date(video.snippet.publishedAt) : null,
          thumbnailUrl: video.snippet?.thumbnails?.medium?.url ?? null,
          viewCount: Number(video.statistics?.viewCount ?? 0),
        },
      })
      totalImported++
    }
  }

  await db.channel.update({
    where: { id: channel.id },
    data: { lastSyncedAt: new Date() },
  })

  return NextResponse.json({ imported: totalImported })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const channel = await db.channel.findFirst({
    where: { id: params.channelId, userId: session.user.id },
  })
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const riskFilter = searchParams.get("risk")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50

  const videos = await db.video.findMany({
    where: {
      channelId: channel.id,
      ...(riskFilter ? { riskScore: riskFilter as any } : {}),
    },
    include: {
      videoTracks: { include: { track: true } },
    },
    orderBy: { viewCount: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json({ videos })
}
