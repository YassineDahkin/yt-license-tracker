import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UploadZone } from "@/components/licenses/upload-zone"

function platformLabel(p: string) {
  switch (p) {
    case "EPIDEMIC_SOUND": return "Epidemic Sound"
    case "ARTLIST": return "Artlist"
    case "MUSICBED": return "Musicbed"
    case "POND5": return "Pond5"
    default: return p
  }
}

function expiryLabel(expiresAt: Date | null) {
  if (!expiresAt) return <span className="text-xs text-green-600">Perpetual</span>
  const now = new Date()
  const days = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return <Badge variant="destructive">Expired</Badge>
  if (days <= 30) return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{days}d left</Badge>
  return <span className="text-xs text-gray-500">{expiresAt.toLocaleDateString()}</span>
}

export default async function LicensesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const licenses = await db.license.findMany({
    where: { userId: session.user.id },
    include: { track: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
          <p className="text-sm text-gray-500">
            {licenses.length} license{licenses.length !== 1 ? "s" : ""} imported
          </p>
        </div>
      </div>

      <UploadZone />

      {licenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imported Licenses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {licenses.map((lic) => (
                <div key={lic.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lic.track.title}</p>
                    <p className="text-xs text-gray-500">{lic.track.artist}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{platformLabel(lic.platform)}</span>
                    {expiryLabel(lic.expiresAt)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {licenses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-gray-500">No licenses uploaded yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Upload a CSV from Epidemic Sound or Artlist to start tracking.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
