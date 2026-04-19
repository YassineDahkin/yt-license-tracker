import { getAnalyticsClient } from "@/lib/youtube"

export interface VideoRevenueSnapshot {
  youtubeVideoId: string
  date: string // YYYY-MM-DD
  estimatedRevenue: number
  views: number
}

export async function fetchChannelRevenue(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string,
): Promise<VideoRevenueSnapshot[]> {
  const analytics = getAnalyticsClient(accessToken)

  const res = await analytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "estimatedRevenue,views",
    dimensions: "video,day",
    sort: "day",
    maxResults: 200,
  })

  const rows = res.data.rows ?? []
  return rows.map((row) => ({
    youtubeVideoId: row[0] as string,
    date: row[1] as string,
    estimatedRevenue: parseFloat(row[2] as string) || 0,
    views: parseInt(row[3] as string) || 0,
  }))
}
