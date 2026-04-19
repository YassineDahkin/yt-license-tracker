import { google } from "googleapis"

function getOAuth2Client(accessToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2.setCredentials({ access_token: accessToken })
  return oauth2
}

export function getYouTubeClient(accessToken: string) {
  return google.youtube({ version: "v3", auth: getOAuth2Client(accessToken) })
}

export function getAnalyticsClient(accessToken: string) {
  return google.youtubeAnalytics({
    version: "v2",
    auth: getOAuth2Client(accessToken),
  })
}

/**
 * Fetch the authenticated user's channel info.
 * Returns channelId, title, thumbnailUrl, subscriberCount, videoCount.
 */
export async function fetchMyChannel(accessToken: string) {
  const yt = getYouTubeClient(accessToken)
  const res = await yt.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  })
  const channel = res.data.items?.[0]
  if (!channel) return null
  return {
    youtubeChannelId: channel.id!,
    title: channel.snippet?.title ?? "Untitled",
    thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? null,
    subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
    videoCount: Number(channel.statistics?.videoCount ?? 0),
  }
}

/**
 * Fetch all video IDs on a channel using the uploads playlist.
 * Uses playlistItems.list (1 unit each) instead of search.list (100 units each).
 */
export async function fetchAllVideoIds(
  accessToken: string,
  uploadsPlaylistId: string,
): Promise<string[]> {
  const yt = getYouTubeClient(accessToken)
  const ids: string[] = []
  let pageToken: string | undefined

  do {
    const res = await yt.playlistItems.list({
      part: ["contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
    })
    const videoIds =
      res.data.items?.map((i) => i.contentDetails?.videoId).filter(Boolean) as string[]
    ids.push(...videoIds)
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  return ids
}

/**
 * Get the uploads playlist ID for a channel.
 */
export async function getUploadsPlaylistId(
  accessToken: string,
  channelId: string,
): Promise<string | null> {
  const yt = getYouTubeClient(accessToken)
  const res = await yt.channels.list({
    part: ["contentDetails"],
    id: [channelId],
  })
  return (
    res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null
  )
}

/**
 * Fetch full details for up to 50 video IDs at once.
 * Cost: 1 quota unit per call.
 */
export async function fetchVideoDetails(
  accessToken: string,
  videoIds: string[],
) {
  const yt = getYouTubeClient(accessToken)
  const res = await yt.videos.list({
    part: ["snippet", "statistics", "contentDetails"],
    id: videoIds,
  })
  return res.data.items ?? []
}
