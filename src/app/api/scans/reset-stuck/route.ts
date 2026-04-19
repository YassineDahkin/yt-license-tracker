import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// Resets any SCANNING videos back to PENDING so next scan picks them up.
// Called automatically by the frontend when it detects a stalled scan.
export async function POST(req: Request) {
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
  })
  if (!channel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { count } = await db.video.updateMany({
    where: { channelId, scanStatus: "SCANNING" },
    data: { scanStatus: "PENDING" },
  })

  return NextResponse.json({ reset: count })
}
