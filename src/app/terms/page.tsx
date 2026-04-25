import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Terms of Service — TuneGuard",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b max-w-6xl mx-auto">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="TuneGuard" width={44} height={44} className="rounded-md" />
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Effective date: April 25, 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of terms</h2>
            <p>
              By creating an account or using TuneGuard ("Service"), you agree to these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users of tuneguard.lol.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Description of service</h2>
            <p>
              TuneGuard is a YouTube music license tracking tool that helps creators monitor which videos contain licensed music, track license expiry dates, and receive alerts before Content ID claims occur. The Service uses read-only access to your YouTube channel and Analytics data via Google OAuth.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Eligibility</h2>
            <p>
              You must be at least 13 years old to use TuneGuard. By using the Service, you represent that you have the legal capacity to enter into this agreement. If you are using TuneGuard on behalf of an organization, you represent that you have authority to bind that organization to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Your account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the security of your Google account</li>
              <li>You are responsible for all activity that occurs under your TuneGuard account</li>
              <li>You must notify us immediately at <a href="mailto:support@tuneguard.lol" className="text-blue-600 underline">support@tuneguard.lol</a> if you suspect unauthorized access</li>
              <li>We reserve the right to terminate accounts that violate these terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Acceptable use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to circumvent any usage limits or access controls</li>
              <li>Resell, sublicense, or commercially exploit the Service without our written permission</li>
              <li>Interfere with or disrupt the Service or servers connected to it</li>
              <li>Use automated means to access the Service beyond normal usage patterns</li>
              <li>Upload malicious files or content through the CSV import feature</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. YouTube and Google terms</h2>
            <p className="mb-2">
              TuneGuard accesses YouTube and Google data on your behalf. By using TuneGuard, you agree to be bound by:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <a href="https://www.youtube.com/t/terms" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                  YouTube Terms of Service
                </a>
              </li>
              <li>
                <a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                  Google Privacy Policy
                </a>
              </li>
            </ul>
            <p className="mt-3">
              TuneGuard is not affiliated with, endorsed by, or sponsored by YouTube or Google LLC.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Subscriptions and billing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Paid plans are billed monthly in advance via Stripe</li>
              <li>You can cancel your subscription at any time from the Billing section; cancellation takes effect at the end of the current billing period</li>
              <li>We do not offer refunds for partial billing periods</li>
              <li>We reserve the right to change pricing with 30 days notice to active subscribers</li>
              <li>The Free tier may have its feature set changed at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. No legal advice</h2>
            <p className="mb-3">
              TuneGuard provides information and tools to help you manage music licenses. Nothing in the Service constitutes legal advice. The dispute assistant generates suggested text based on your license data — it is not a substitute for legal counsel.
            </p>
            <p className="text-sm bg-amber-50 border border-amber-200 rounded p-3 text-amber-900">
              If you receive a copyright strike or legal notice, consult a qualified attorney. TuneGuard's suggestions are informational only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Music detection accuracy</h2>
            <p>
              Music detection is performed by the AudD API and is not guaranteed to be 100% accurate. TuneGuard may not detect all music in every video, and detection results may vary. You are responsible for verifying your own license compliance. TuneGuard is a monitoring aid, not a compliance guarantee.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Intellectual property</h2>
            <p>
              The TuneGuard name, logo, and software are owned by TuneGuard. You retain ownership of all data you upload (CSV files, account information). You grant TuneGuard a limited license to process that data to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Disclaimer of warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that alerts will be delivered before every license expiry or Content ID claim. Use the Service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, TuneGuard shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost revenue, lost profits, or loss of data, arising from your use of or inability to use the Service. Our total liability for any claim arising from these terms or your use of the Service shall not exceed the amount you paid us in the 3 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">13. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these terms. You may delete your account at any time from account settings. Upon termination, your right to use the Service ceases immediately and your data will be deleted as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">14. Changes to terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of material changes via email. Continued use of the Service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">15. Governing law</h2>
            <p>
              These terms are governed by applicable law. Any disputes will be resolved through good-faith negotiation first. If unresolved, disputes will be submitted to binding arbitration or a court of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">16. Contact</h2>
            <p>
              Questions about these terms?{" "}
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
