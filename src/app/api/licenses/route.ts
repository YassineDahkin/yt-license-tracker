import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import Papa from "papaparse"
import { parseLicenseCsv } from "@/lib/csv-parsers"
import { inngest } from "@/inngest/client"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const epidemicRenewalDateRaw = formData.get("epidemicRenewalDate") as string | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const text = await file.text()
  const { data: rows, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length > 0 && rows.length === 0) {
    return NextResponse.json(
      { error: `CSV parse error: ${errors[0].message}` },
      { status: 400 },
    )
  }

  const epidemicRenewalDate = epidemicRenewalDateRaw
    ? new Date(epidemicRenewalDateRaw)
    : undefined

  const { licenses, platform, error } = parseLicenseCsv(
    rows,
    undefined,
    epidemicRenewalDate,
  )

  if (error) {
    return NextResponse.json({ error }, { status: 422 })
  }

  // For each parsed license, find or create a track by ISRC or title+artist,
  // then upsert the license.
  let saved = 0
  for (const lic of licenses) {
    // 1. Find matching track
    let track = null
    if (lic.isrc) {
      track = await db.track.findUnique({ where: { isrc: lic.isrc } })
    }
    if (!track) {
      // Fuzzy match by title + artist (case-insensitive)
      track = await db.track.findFirst({
        where: {
          title: { equals: lic.title, mode: "insensitive" },
          artist: { equals: lic.artist, mode: "insensitive" },
        },
      })
    }
    if (!track) {
      // Create stub track — will be matched to video tracks later
      const fallbackIsrc = `csv::${lic.platform.toLowerCase()}::${lic.artist.toLowerCase()}::${lic.title.toLowerCase()}`
      track = await db.track.upsert({
        where: { isrc: fallbackIsrc },
        update: {},
        create: {
          title: lic.title,
          artist: lic.artist,
          isrc: fallbackIsrc,
        },
      })
    }

    // 2. Upsert license
    await db.license.upsert({
      where: {
        userId_trackId_platform: {
          userId,
          trackId: track.id,
          platform: lic.platform,
        },
      },
      update: {
        expiresAt: lic.expiresAt,
        purchasedAt: lic.purchasedAt,
      },
      create: {
        userId,
        trackId: track.id,
        platform: lic.platform,
        expiresAt: lic.expiresAt,
        purchasedAt: lic.purchasedAt,
      },
    })
    saved++
  }

  // Trigger background risk rescoring
  await inngest.send({
    name: "licenses/uploaded",
    data: { userId },
  })

  return NextResponse.json({ saved, platform })
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const licenses = await db.license.findMany({
    where: { userId: session.user.id },
    include: { track: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(licenses)
}
