import Link from "next/link"
import Image from "next/image"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b max-w-6xl mx-auto">
        <div className="flex items-center">
          <Image src="/logo.png" alt="TuneGuard" width={44} height={44} className="rounded-md" />
        </div>
        <Link
          href="/login"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800 mb-6">
          ⚠️ Content ID claims cost creators thousands in lost revenue every year
        </div>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-tight">
          Know which videos will get
          <br />
          <span className="text-blue-600">claimed before YouTube does</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          TuneGuard connects your YouTube channel to your music licenses.
          Get alerts before licenses expire, and pre-filled dispute text when claims hit.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Start for free →
          </Link>
          <span className="text-sm text-gray-500">No credit card required</span>
        </div>
      </section>

      {/* Problem callout */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <p className="text-sm font-medium text-red-900 mb-2">The scenario that plays out thousands of times a day:</p>
          <p className="text-sm text-red-800 leading-relaxed">
            A creator cancels their Epidemic Sound subscription in March. In August, six videos start getting Content ID claims — silently demonetizing $400/month in AdSense revenue. They only notice because their payment was lower. By then, the damage is done.
          </p>
          <p className="mt-3 text-sm font-semibold text-red-900">TuneGuard sends an alert in March. Problem prevented.</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Everything in one place</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🎵",
              title: "Automatic music detection",
              desc: "Connect your channel and we scan every video for music using AudD. No manual tagging.",
            },
            {
              icon: "📋",
              title: "License tracking",
              desc: "Upload your Epidemic Sound or Artlist CSV. We map every track to every video and watch the expiry dates.",
            },
            {
              icon: "⚡",
              title: "Expiry alerts",
              desc: "Get emails 30, 14, and 3 days before a license expires. Urgent alerts go out the same morning.",
            },
            {
              icon: "📉",
              title: "Revenue drop detection",
              desc: "When RPM drops 25% overnight, we flag it. That's often the first sign of a Content ID claim.",
            },
            {
              icon: "⚖️",
              title: "Dispute assistant",
              desc: "Pre-filled dispute text based on your actual license data. Ranked by confidence. Not legal advice.",
            },
            {
              icon: "🔒",
              title: "Your data, your OAuth",
              desc: "Analytics are read directly from your Google account. We never store revenue data you don't explicitly sync.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-gray-200 p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 border-t py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Simple pricing</h2>
          <p className="text-sm text-gray-500 text-center mb-10">One prevented claim pays for a year of Creator.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                period: "",
                features: ["Up to 50 videos", "1 channel", "Music detection", "License CSV upload", "Email alerts"],
                cta: "Get started",
                highlight: false,
              },
              {
                name: "Creator",
                price: "$19",
                period: "/mo",
                features: ["Unlimited videos", "1 channel", "Music detection", "License CSV upload", "Email alerts", "Dispute assistant"],
                cta: "Start Creator",
                highlight: true,
              },
              {
                name: "Pro",
                price: "$49",
                period: "/mo",
                features: ["Unlimited videos", "3 channels", "Music detection", "License CSV upload", "Email alerts", "Dispute assistant", "Priority support"],
                cta: "Start Pro",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 border ${plan.highlight ? "border-blue-500 border-2 bg-white shadow-md" : "border-gray-200 bg-white"}`}
              >
                {plan.highlight && (
                  <div className="text-xs font-semibold text-blue-600 mb-2">MOST POPULAR</div>
                )}
                <div className="font-bold text-gray-900 text-lg">{plan.name}</div>
                <div className="mt-1 mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500 text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block text-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    plan.highlight
                      ? "bg-gray-900 text-white hover:bg-gray-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center gap-4 flex-wrap">
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
