import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { getUserPlan, assertDisputeAccess, PlanGateError } from "@/lib/plan-gate"
import { generateDisputeOptions } from "@/lib/dispute-generator"
import { DisputeOptionCard } from "@/components/disputes/dispute-option-card"
import { UpgradeGate } from "@/components/billing/upgrade-gate"

interface Props {
  params: Promise<{ videoId: string }>
}

export default async function DisputesPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { videoId } = await params

  // Plan gate
  try {
    await assertDisputeAccess(session.user.id)
  } catch (err) {
    if (err instanceof PlanGateError) {
      return (
        <UpgradeGate
          feature="Dispute Assistant"
          description="Generate pre-filled dispute text for copyright claims. Available on Creator and Pro plans."
        />
      )
    }
    throw err
  }

  const video = await db.video.findFirst({
    where: { id: videoId, channel: { userId: session.user.id } },
    include: {
      videoTracks: {
        include: {
          track: {
            include: {
              licenses: {
                where: { userId: session.user.id },
                orderBy: { expiresAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  if (!video) notFound()

  const tracks = video.videoTracks.map((vt) => vt.track)

  if (tracks.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Dispute Assistant</h1>
        <p className="text-muted-foreground">
          No tracks detected in <strong>{video.title}</strong>. Scan the video first.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dispute Assistant</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Video: <strong>{video.title}</strong>
        </p>
      </div>

      {tracks.map((track) => {
        const license = track.licenses[0] ?? null
        const hasValidLicense = !!license && (!license.expiresAt || license.expiresAt > new Date())

        const options = generateDisputeOptions({
          trackTitle: track.title,
          artist: track.artist,
          platform: license?.platform ?? "MANUAL",
          videoTitle: video.title,
          hasValidLicense,
          licenseType: license?.licenseType ?? undefined,
          purchasedAt: license?.purchasedAt ?? undefined,
        })

        return (
          <div key={track.id} className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="font-semibold">
                "{track.title}" by {track.artist}
              </h2>
              {license && (
                <p className="text-xs text-muted-foreground mt-1">
                  License: {license.platform}
                  {license.expiresAt && ` · expires ${new Date(license.expiresAt).toLocaleDateString()}`}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {options.map((option, i) => (
                <DisputeOptionCard key={option.id} option={option} rank={i + 1} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
