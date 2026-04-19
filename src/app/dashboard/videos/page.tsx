import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function ScanBadge({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return <span className="text-xs text-green-600">Scanned</span>
    case "SCANNING":
      return <span className="text-xs text-blue-600">Scanning…</span>
    case "FAILED":
      return <span className="text-xs text-red-500">Failed</span>
    default:
      return <span className="text-xs text-gray-400">Pending</span>
  }
}

export default async function VideosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const channels = await db.channel.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })
  const channelIds = channels.map((c) => c.id)

  const videos = await db.video.findMany({
    where: { channelId: { in: channelIds } },
    include: {
      videoTracks: {
        include: { track: true },
      },
    },
    orderBy: { viewCount: "desc" },
    take: 100,
  })

  const scanned = videos.filter((v) => v.scanStatus === "COMPLETED").length
  const withTracks = videos.filter((v) => v.videoTracks.length > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
          <p className="text-sm text-gray-500">
            {scanned} scanned · {withTracks} with detected tracks
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {videos.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No videos yet. Sync a channel first.
            </div>
          ) : (
            <div className="divide-y">
              {videos.map((video) => (
                <div key={video.id} className="flex items-start gap-4 px-6 py-4">
                  {video.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-16 w-28 flex-shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={`https://youtube.com/watch?v=${video.youtubeVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm font-medium text-gray-900 hover:underline"
                      >
                        {video.title}
                      </a>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <RiskBadge risk={video.riskScore} />
                        <ScanBadge status={video.scanStatus} />
                        {video.videoTracks.length > 0 && (
                          <Link href={`/dashboard/disputes/${video.id}`}>
                            <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                              Dispute
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    {video.viewCount != null && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatNumber(video.viewCount)} views
                      </p>
                    )}
                    {video.videoTracks.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {video.videoTracks.map((vt) => (
                          <span
                            key={vt.id}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            🎵 {vt.track.artist} — {vt.track.title}
                            <span className="text-gray-400">
                              ({vt.source === "AUDD" ? "detected" : "description"})
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : video.scanStatus === "COMPLETED" ? (
                      <p className="mt-1 text-xs text-gray-400">No music detected</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
