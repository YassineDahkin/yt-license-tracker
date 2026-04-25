import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Privacy Policy — TuneGuard",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b max-w-6xl mx-auto">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="TuneGuard" width={44} height={44} className="rounded-md" />
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Effective date: April 25, 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Who we are</h2>
            <p>
              TuneGuard ("we", "us", "our") is a YouTube music license tracking service operated at{" "}
              <a href="https://tuneguard.lol" className="text-blue-600 underline">tuneguard.lol</a>.
              We help YouTube creators track music licenses and receive alerts before Content ID claims occur.
              Contact us at{" "}
              <a href="mailto:support@tuneguard.lol" className="text-blue-600 underline">support@tuneguard.lol</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. What data we collect</h2>
            <h3 className="font-medium text-gray-800 mb-2">Data you provide</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your Google account name, email address, and profile picture (via Google OAuth sign-in)</li>
              <li>Music license CSV files you upload (track names, download dates, license types from Epidemic Sound, Artlist, or similar services)</li>
            </ul>
            <h3 className="font-medium text-gray-800 mt-4 mb-2">Data we collect from YouTube on your behalf</h3>
            <p className="mb-2">With your explicit OAuth consent, we access the following read-only data from your Google/YouTube account:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your YouTube channel metadata (channel ID, title)</li>
              <li>Your video list (titles, descriptions, view counts, upload dates, monetization status)</li>
              <li>Your YouTube Analytics revenue data (estimated revenue per video, used to detect abnormal drops)</li>
            </ul>
            <p className="mt-3 text-sm bg-gray-50 border border-gray-200 rounded p-3">
              We request <strong>read-only</strong> access only. We never post, upload, modify, or delete anything on your YouTube channel or Google account.
            </p>
            <h3 className="font-medium text-gray-800 mt-4 mb-2">Data collected automatically</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Server logs (IP address, browser type, pages visited) — retained for up to 30 days</li>
              <li>Cookies necessary for session management (via NextAuth.js)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To identify music tracks in your videos using the AudD music recognition API (your YouTube video URL is sent to AudD; no audio is downloaded to our servers)</li>
              <li>To match detected tracks against your uploaded license records</li>
              <li>To calculate license expiry dates and assign risk levels to your videos</li>
              <li>To send you email alerts about expiring licenses and detected revenue drops</li>
              <li>To process subscription payments via Stripe</li>
              <li>To provide and improve the TuneGuard service</li>
            </ul>
            <p className="mt-3">We do not sell your data. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Third-party services</h2>
            <p className="mb-3">We use the following third-party services to operate TuneGuard:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Service</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Purpose</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Data shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2">Google OAuth</td>
                    <td className="px-4 py-2">Authentication, YouTube & Analytics access</td>
                    <td className="px-4 py-2">Email, YouTube channel data</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">AudD API</td>
                    <td className="px-4 py-2">Music recognition</td>
                    <td className="px-4 py-2">YouTube video URLs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Stripe</td>
                    <td className="px-4 py-2">Subscription billing</td>
                    <td className="px-4 py-2">Email, payment details</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Resend</td>
                    <td className="px-4 py-2">Transactional email</td>
                    <td className="px-4 py-2">Email address</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Neon (PostgreSQL)</td>
                    <td className="px-4 py-2">Database hosting</td>
                    <td className="px-4 py-2">All stored account data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Google API data disclosure</h2>
            <p className="mb-2">
              TuneGuard's use and transfer of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="mb-2">Specifically:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>We only request YouTube and Analytics data scopes necessary to provide the TuneGuard service</li>
              <li>We do not share Google user data with third parties except as described in this policy</li>
              <li>We do not use Google user data to serve advertising</li>
              <li>We do not allow humans to read Google user data unless you explicitly request support and grant us permission</li>
              <li>You can revoke TuneGuard's access to your Google account at any time from your{" "}
                <a href="https://myaccount.google.com/permissions" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                  Google account permissions page
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your account data is retained as long as your account is active</li>
              <li>Revenue snapshots are retained for up to 12 months</li>
              <li>When you delete your account, all associated data is permanently deleted within 30 days</li>
              <li>Stripe retains billing records as required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Your rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Revoke Google OAuth access at any time</li>
              <li>Export your data</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{" "}
              <a href="mailto:support@tuneguard.lol" className="text-blue-600 underline">support@tuneguard.lol</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Security</h2>
            <p>
              All data is transmitted over HTTPS. Database credentials and API keys are stored as environment variables and never exposed to the client. OAuth tokens are stored securely and used only to make authorized API calls on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Children's privacy</h2>
            <p>
              TuneGuard is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal data, contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of material changes via email or a notice on the app. Continued use of TuneGuard after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>
              Questions about this policy?{" "}
              <a href="mailto:support@tuneguard.lol" className="text-blue-600 underline">support@tuneguard.lol</a>
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t py-8 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center gap-4">
          <span>TuneGuard — YouTube Music License Tracker · Not affiliated with YouTube or Google</span>
          <span>·</span>
          <Link href="/privacy" className="hover:text-gray-600 underline">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-gray-600 underline">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
