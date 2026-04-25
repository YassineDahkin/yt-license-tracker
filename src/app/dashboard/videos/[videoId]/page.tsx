import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatNumber } from "@/lib/utils"

function RiskBadge({ risk }: { risk: string }) {
  switch (risk) {
    case "EXPIRED":
      return <Badge variant="destructive">Expired</Badge>
    case "AT_RISK":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">At Risk</Badge>
    case "SAFE":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Safe</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

function formatOffset(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function detectRevenueDrop(snapshots: { date: Date; estimatedRevenue: number | null }[]): {
  hasDrop: boolean
  dropPercent: number
  recentAvg: number
  priorAvg: number
} {
  if (snapshots.length < 7) return { hasDrop: false, dropPercent: 0, recentAvg: 0, priorAvg: 0 }

  const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const recent = sorted.slice(-7)
  const prior = sorted.slice(-14, -7)

  if (prior.length < 3) return { hasDrop: false, dropPercent: 0, recentAvg: 0, priorAvg: 0 }

  const avg = (arr: typeof sorted) =>
    arr.reduce((s, r) => s + (r.estimatedRevenue ?? 0), 0) / arr.length

  const recentAvg = avg(recent)
  const priorAvg = avg(prior)

  if (priorAvg < 0.01) return { hasDrop: false, dropPercent: 0, recentAvg, priorAvg }

  const dropPercent = ((priorAvg - recentAvg) / priorAvg) * 100
  return { hasDrop: dropPercent >= 40, dropPercent, recentAvg, priorAvg }
}

export default async function VideoDetailPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const video = await db.video.findUnique({
    where: { id: videoId },
    include: {
      channel: { select: { userId: true, youtubeChannelId: true } },
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
        orderBy: { offsetSeconds: "asc" },
      },
      videoRevenueSnapshots: {
        orderBy: { date: "asc" },
        take: 30,
      },
    },
  })

  if (!video || video.channel.userId !== session.user.id) notFound()

  const { hasDrop, dropPercent, recentAvg, priorAvg } = detectRevenueDrop(video.videoRevenueSnapshots)

  const maxRevenue = Math.max(...video.videoRevenueSnapshots.map((s) => s.estimatedRevenue ?? 0), 0.01)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/dashboard/videos" className="text-sm text-gray-500 hover:text-gray-700">
        ← All Videos
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-24 w-40 flex-shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 flex-1">{video.title}</h1>
            <RiskBadge risk={video.riskScore} />
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
            {video.viewCount != null && <span>{formatNumber(video.viewCount)} views</span>}
            {video.publishedAt && (
              <span>Published {new Date(video.publishedAt).toLocaleDateString()}</span>
            )}
            <a
              href={`https://youtube.com/watch?v=${video.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Watch on YouTube ↗
            </a>
          </div>
        </div>
      </div>

      {/* Revenue Drop Alert */}
      {hasDrop && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg">📉</span>
            <div>
              <p className="font-semibold text-red-900 text-sm">Revenue drop detected</p>
              <p className="text-sm text-red-800 mt-1">
                Revenue dropped <strong>{dropPercent.toFixed(0)}%</strong> in the last 7 days
                (${recentAvg.toFixed(4)}/day avg vs ${priorAvg.toFixed(4)}/day prior week).
                This may indicate a Content ID claim.
              </p>
              <p className="text-xs text-red-700 mt-2">
                A Content ID claim does not affect your channel standing — only this video's monetization.
                Check YouTube Studio → Content → Copyright for active claims.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detected Music */}
      <div className="rounded-lg border border-gray-200">
        <div className="border-b bg-gray-50 px-4 py-3">
          <h2 className="font-semibold text-gray-900 text-sm">
            Detected Music {video.videoTracks.length > 0 && `(${video.videoTracks.length} track${video.videoTracks.length > 1 ? "s" : ""})`}
          </h2>
        </div>
        {video.videoTracks.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            {video.scanStatus === "COMPLETED" ? "No music detected in this video." : "Not yet scanned."}
          </div>
        ) : (
          <div className="divide-y">
            {video.videoTracks.map((vt) => {
              const license = vt.track.licenses[0]
              const now = new Date()
              let licenseStatus: "licensed" | "expired" | "none" = "none"
              if (license) {
                licenseStatus = !license.expiresAt || new Date(license.expiresAt) > now ? "licensed" : "expired"
              }

              return (
                <div key={vt.id} className="flex items-start gap-4 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">
                        {vt.track.title}
                      </span>
                      <span className="text-gray-500 text-sm">by {vt.track.artist}</span>
                      {licenseStatus === "licensed" && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Licensed</span>
                      )}
                      {licenseStatus === "expired" && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">License expired</span>
                      )}
                      {licenseStatus === "none" && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">No license</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                      {vt.track.label && <span>Label: {vt.track.label}</span>}
                      {vt.track.isrc && !vt.track.isrc.startsWith("audd::") && !vt.track.isrc.startsWith("desc::") && (
                        <span>ISRC: {vt.track.isrc}</span>
                      )}
                      {vt.offsetSeconds != null && (
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          detected at {formatOffset(vt.offsetSeconds)}
                        </span>
                      )}
                      <span className="text-gray-400">
                        via {vt.source === "AUDD" ? "audio scan" : "description"}
                      </span>
                    </div>
                    {license && (
                      <div className="mt-1 text-xs text-gray-400">
                        {license.platform.replace(/_/g, " ")}
                        {license.expiresAt && ` · expires ${new Date(license.expiresAt).toLocaleDateString()}`}
                        {!license.expiresAt && " · perpetual"}
                      </div>
                    )}
                  </div>
                  {licenseStatus === "none" && (
                    <Link
                      href={`/dashboard/disputes/${video.id}`}
                      className="flex-shrink-0 rounded border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Dispute help
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Revenue Chart */}
      {video.videoRevenueSnapshots.length > 0 && (
        <div className="rounded-lg border border-gray-200">
          <div className="border-b bg-gray-50 px-4 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Revenue (last 30 days)</h2>
            <span className="text-xs text-gray-400">from YouTube Analytics</span>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-end gap-0.5 h-24">
              {video.videoRevenueSnapshots.map((s) => {
                const pct = ((s.estimatedRevenue ?? 0) / maxRevenue) * 100
                const isRecent = video.videoRevenueSnapshots.indexOf(s) >= video.videoRevenueSnapshots.length - 7
                return (
                  <div
                    key={s.id}
                    className="group relative flex-1"
                    title={`${new Date(s.date).toLocaleDateString()}: $${(s.estimatedRevenue ?? 0).toFixed(4)}`}
                  >
                    <div
                      className={`w-full rounded-sm transition-opacity ${hasDrop && isRecent ? "bg-red-400" : "bg-blue-400"}`}
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>{new Date(video.videoRevenueSnapshots[0].date).toLocaleDateString()}</span>
              <span>{new Date(video.videoRevenueSnapshots[video.videoRevenueSnapshots.length - 1].date).toLocaleDateString()}</span>
            </div>
            {hasDrop && (
              <p className="mt-2 text-xs text-red-600">Red bars = last 7 days (drop period)</p>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {video.description && (
        <div className="rounded-lg border border-gray-200">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h2 className="font-semibold text-gray-900 text-sm">Description</h2>
          </div>
          <div className="px-4 py-4">
            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed line-clamp-6">
              {video.description}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
