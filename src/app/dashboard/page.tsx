import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatNumber } from "@/lib/utils"
import { ConnectChannelButton } from "@/components/dashboard/connect-channel-button"
import { SyncVideosButton } from "@/components/dashboard/sync-videos-button"
import { ScanButton } from "@/components/dashboard/scan-button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const channels = await db.channel.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { videos: true } },
      videos: {
        select: { riskScore: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const alerts = await db.alert.findMany({
    where: { userId: session.user.id, read: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const totalVideos = channels.reduce((acc, c) => acc + c._count.videos, 0)

  const riskCounts = channels.reduce(
    (acc, channel) => {
      for (const v of channel.videos) {
        acc[v.riskScore] = (acc[v.riskScore] ?? 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">
          Monitor your YouTube music licenses and revenue health.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalVideos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-green-600 uppercase tracking-wide">
              Safe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {riskCounts["SAFE"] ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">
              {riskCounts["AT_RISK"] ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-red-600 uppercase tracking-wide">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {riskCounts["EXPIRED"] ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channels */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Connected Channels</CardTitle>
          <ConnectChannelButton />
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No channels connected yet.</p>
              <p className="mt-1 text-xs text-gray-400">
                Click &quot;Connect Channel&quot; to import your YouTube videos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{channel.title}</p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(channel._count.videos)} videos imported
                      {channel.subscriberCount
                        ? ` · ${formatNumber(channel.subscriberCount)} subscribers`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SyncVideosButton channelId={channel.id} />
                    {channel._count.videos > 0 && (
                      <ScanButton channelId={channel.id} videoCount={channel._count.videos} />
                    )}
                    {(riskCounts["EXPIRED"] ?? 0) > 0 && (
                      <Badge variant="destructive">
                        {riskCounts["EXPIRED"]} expired
                      </Badge>
                    )}
                    {(riskCounts["AT_RISK"] ?? 0) > 0 && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        {riskCounts["AT_RISK"]} at risk
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">{alert.title}</p>
                    <p className="text-xs text-amber-700">{alert.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
