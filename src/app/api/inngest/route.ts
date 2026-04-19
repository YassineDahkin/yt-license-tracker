import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import {
  bulkScanFunction,
  scanVideoFunction,
  scoreVideosFunction,
  nightlyCheckFunction,
  checkLicenseExpiryFunction,
  fetchAnalyticsFunction,
  checkRevenueDropsFunction,
} from "@/inngest"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    bulkScanFunction,
    scanVideoFunction,
    scoreVideosFunction,
    nightlyCheckFunction,
    checkLicenseExpiryFunction,
    fetchAnalyticsFunction,
    checkRevenueDropsFunction,
  ],
})
