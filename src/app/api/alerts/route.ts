import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const alerts = await db.alert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(alerts)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { alertId, readAll } = await req.json()

  if (readAll) {
    await db.alert.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  if (alertId) {
    await db.alert.update({
      where: { id: alertId, userId: session.user.id },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "alertId or readAll required" }, { status: 400 })
}
