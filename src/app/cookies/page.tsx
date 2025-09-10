import Link from 'next/link'

export default function CookiesPage() {
  const effectiveDate = new Date('2025-09-10').toLocaleDateString('en-US')

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
            <p className="mt-4 text-gray-600">Effective date: {effectiveDate}</p>
            <p className="mt-4 text-gray-700">This Cookie Policy explains how Accounting Firm uses cookies and similar technologies on our site and within the platform.</p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">What are cookies?</h2>
          <p className="mt-2 text-gray-700">Cookies are small text files placed on your device to store preferences, session information, and anonymous identifiers. They enable site functionality and measurement.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Types of cookies we use</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Authentication cookies:</strong> used for NextAuth session management and to keep you signed in.</li>
            <li><strong>CSRF &amp; security cookies:</strong> protect against cross-site request forgery and help secure your session.</li>
            <li><strong>Functionality cookies:</strong> store preferences such as language, UI settings, and dashboard layout.</li>
            <li><strong>Analytics cookies:</strong> anonymous identifiers used by Google Analytics and other tools to analyze usage and performance.</li>
            <li><strong>Marketing cookies:</strong> used for newsletter and campaign tracking; only set if you consent.</li>
            <li><strong>Third-party cookies:</strong> payment processors, CDN providers, and email delivery services may set cookies as part of integrated features.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">How we use cookies</h2>
          <p className="mt-2 text-gray-700">Cookies enable secure authentication (NextAuth), preserve account preferences, improve product performance, and measure usage for product decisions. Marketing cookies help us run email campaigns and measure their effectiveness when you opt in.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Third-party services</h2>
          <p className="mt-2 text-gray-700">We integrate with providers such as SendGrid (email), analytics providers, payment processors, and CDN networks. These parties may use their own cookies; please consult their privacy and cookie notices for details.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Managing cookies</h2>
          <p className="mt-2 text-gray-700">You can manage cookie preferences through your browser settings and through your account privacy settings. We recommend providing granular control in your account settings to enable/disable analytics and marketing cookies while preserving necessary authentication and security cookies.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Implementation recommendations</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
            <li>Show a cookie consent banner on first visit that allows granular choices (necessary, analytics, marketing).</li>
            <li>Persist consent decisions in the user account when logged in so preferences follow the user across devices.</li>
            <li>Do not block necessary cookies required for authentication and security even if analytics cookies are disabled.</li>
            <li>Document the exact cookie names used by NextAuth, analytics, and third-party integrations in your privacy center for transparency.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Contact</h2>
          <p className="mt-2 text-gray-700">Questions about cookies? Contact <a href="mailto:support@accountingfirm.com" className="text-blue-600">support@accountingfirm.com</a>.</p>
        </section>

        <section>
          <div className="mt-4">
            <Link href="/" className="text-blue-600">Return to home</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
