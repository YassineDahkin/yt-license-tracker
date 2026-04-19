import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MarkAllReadButton } from "@/components/alerts/mark-all-read-button"

const ALERT_ICONS: Record<string, string> = {
  LICENSE_EXPIRY_3:  "🔴",
  LICENSE_EXPIRY_14: "🟡",
  LICENSE_EXPIRY_30: "🔵",
  LICENSE_EXPIRED:   "⛔",
  REVENUE_DROP:      "📉",
  SCAN_COMPLETE:     "⚠️",
}

const ALERT_COLORS: Record<string, string> = {
  LICENSE_EXPIRY_3:  "border-red-200 bg-red-50",
  LICENSE_EXPIRY_14: "border-amber-200 bg-amber-50",
  LICENSE_EXPIRY_30: "border-blue-200 bg-blue-50",
  LICENSE_EXPIRED:   "border-red-300 bg-red-100",
  REVENUE_DROP:      "border-orange-200 bg-orange-50",
  SCAN_COMPLETE:     "border-amber-200 bg-amber-50",
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function AlertsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const alerts = await db.alert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unread = alerts.filter((a) => !a.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              No alerts yet. Alerts appear when licenses are expiring.
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 px-6 py-4 ${
                    !alert.read ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <span className="mt-0.5 text-lg leading-none">
                    {ALERT_ICONS[alert.type] ?? "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${alert.read ? "text-gray-500" : "text-gray-900"}`}>
                        {alert.title}
                      </p>
                      {!alert.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`mt-0.5 text-xs ${alert.read ? "text-gray-400" : "text-gray-600"}`}>
                      {alert.body}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {timeAgo(alert.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trigger section for testing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">Test Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400">
            Alerts are generated nightly at 8 AM UTC. To test manually, trigger the{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">nightly-check</code>{" "}
            function in the Inngest dev UI at{" "}
            <a href="http://localhost:8288" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
              localhost:8288
            </a>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
