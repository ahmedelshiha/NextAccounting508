import Link from 'next/link'

export default function TermsPage() {
  const effectiveDate = new Date('2025-09-10').toLocaleDateString('en-US')

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            <p className="mt-4 text-gray-600">Effective date: {effectiveDate}</p>
            <p className="mt-4 text-gray-700">These Terms govern your use of Accounting Firm's platform, including the booking system, client portal, admin features, and related services.</p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
          <p className="mt-2 text-gray-700">By using our services you agree to these Terms. If you do not agree, do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">2. Services &amp; Delivery</h2>
          <p className="mt-2 text-gray-700">We provide a booking and client portal that enables users to request and receive professional accounting services. Specific service terms (scope, deliverables, fees) are governed by separate engagement letters between the firm and the client.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">3. User Accounts &amp; Roles</h2>
          <p className="mt-2 text-gray-700">Users must register for accounts. Roles determine access:</p>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
            <li><strong>CLIENT:</strong> access to own bookings, invoices, and portal resources.</li>
            <li><strong>STAFF:</strong> access to client records necessary to perform services.</li>
            <li><strong>ADMIN:</strong> platform administration, user management, and billing controls. Administrative actions are logged.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">4. Fees &amp; Payment</h2>
          <p className="mt-2 text-gray-700">Fees for services will be disclosed in the booking flow or engagement agreement. Payment processors handle payment card data; we store only transaction metadata. Late payments may incur additional fees as described in your invoice.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">5. Professional Standards &amp; Disclaimers</h2>
          <p className="mt-2 text-gray-700">Our professionals provide accounting and advisory services under applicable professional standards. While we strive for accuracy, we do not guarantee outcomes. To the extent permitted by law, our liability is limited as described in your engagement agreement.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">6. Intellectual Property</h2>
          <p className="mt-2 text-gray-700">The platform and its content are owned by Accounting Firm or licensed third parties. Users retain ownership of their data, but grant Accounting Firm a license to host and process it to provide services.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">7. User Content</h2>
          <p className="mt-2 text-gray-700">Users may upload documents and content. You are responsible for the legality and accuracy of uploaded materials. We may remove content that violates terms or applicable law.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">8. Data &amp; Privacy</h2>
          <p className="mt-2 text-gray-700">Our Privacy Policy explains how we collect and process personal data. By using the platform you consent to such processing. See <Link href="/privacy" className="text-blue-600">Privacy Policy</Link>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">9. Termination</h2>
          <p className="mt-2 text-gray-700">We may suspend or terminate accounts for violations of these Terms, unlawful activity, or at our discretion. Upon termination we will retain data as required by law (including the 7-year retention for accounting records) and otherwise as described in the Privacy Policy.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">10. Governing Law</h2>
          <p className="mt-2 text-gray-700">These Terms are governed by the laws of the jurisdiction in which Accounting Firm operates. Disputes will be subject to the applicable courts and procedures.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">11. Changes to Terms</h2>
          <p className="mt-2 text-gray-700">We may update these Terms; we will notify users of material changes. Continued use after notice constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">12. Contact</h2>
          <p className="mt-2 text-gray-700">Questions about these Terms or the platform can be directed to <a href="mailto:support@accountingfirm.com" className="text-blue-600">support@accountingfirm.com</a>.</p>
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
