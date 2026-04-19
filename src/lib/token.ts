import { db } from "@/lib/db"

export async function getFreshAccessToken(userId: string): Promise<string | null> {
  const account = await db.account.findFirst({
    where: { userId, provider: "google" },
  })
  if (!account) return null

  const now = Math.floor(Date.now() / 1000)
  if (account.access_token && account.expires_at && account.expires_at > now + 60) {
    return account.access_token
  }

  if (!account.refresh_token) return account.access_token

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) return account.access_token

  const data = await res.json() as { access_token: string; expires_in: number }

  await db.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    },
  })

  return data.access_token
}
