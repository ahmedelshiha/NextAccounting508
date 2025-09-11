import Link from 'next/link'

export default function PrivacyPage() {
  const effectiveDate = new Date('2025-09-10').toLocaleDateString('en-US')

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="mt-4 text-gray-600">Effective date: {effectiveDate}</p>
            <p className="mt-4 text-gray-700">This Privacy Policy explains how Accounting Firm collects, uses, discloses, and protects personal data in connection with our website, booking system, client portal, and related services.</p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">1. Scope &amp; Controller</h2>
          <p className="mt-2 text-gray-700">Accounting Firm is the data controller for personal information collected through our platform. This policy applies to all users of our services including CLIENT, STAFF, and ADMIN roles.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">2. Data We Collect</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Account data:</strong> name, email, phone, company, role, permissions, profile settings.</li>
            <li><strong>Booking &amp; service data:</strong> appointment details, service preferences, invoices, payment metadata (no payment card data unless provided to payment processor).</li>
            <li><strong>Communications:</strong> messages, email logs (via SendGrid), support requests.</li>
            <li><strong>Usage data:</strong> analytics, IP, device and browser information, locale and preferences.</li>
            <li><strong>Audit &amp; activity logs:</strong> role changes, profile updates, admin actions for security and compliance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">3. How We Use Data</h2>
          <p className="mt-2 text-gray-700">We use personal data to provide and improve services, process bookings and payments, communicate with users, and fulfill legal and accounting obligations. Typical uses include:</p>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
            <li>Authentication, account management, and access control.</li>
            <li>Delivering booked services and invoicing.</li>
            <li>Sending transactional and marketing emails via SendGrid (subject to user consent).</li>
            <li>Analytics and performance monitoring to improve the product.</li>
            <li>Security, fraud prevention, and compliance (including audit logging).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">4. Role-based Access &amp; Special Considerations</h2>
          <p className="mt-2 text-gray-700">Different roles have different access rights. We limit access based on the principle of least privilege:</p>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
            <li><strong>CLIENT:</strong> access to own profile, bookings, invoices, and shared documents.</li>
            <li><strong>STAFF:</strong> access to client data required for service delivery and internal collaboration.</li>
            <li><strong>ADMIN:</strong> elevated controls for user management, billing, and system settings; activity is logged for audit purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">5. Third-party Integrations</h2>
          <p className="mt-2 text-gray-700">We work with third-party providers to deliver features. These providers may process personal data on our behalf:</p>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
            <li><strong>SendGrid:</strong> transactional and marketing email delivery.</li>
            <li><strong>Payment processors:</strong> payment authorization and settlement (we do not store full card data on our servers).</li>
            <li><strong>Analytics &amp; monitoring:</strong> Google Analytics, Sentry, or similar for product analytics and performance monitoring.</li>
            <li><strong>CDN/Hosting:</strong> static asset delivery and caching.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">6. Data Retention</h2>
          <p className="mt-2 text-gray-700">We retain financial and accounting records for a minimum of seven (7) years to comply with applicable accounting and regulatory requirements. Other personal data is retained only as long as necessary to provide services, meet legal obligations, resolve disputes, and enforce agreements.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">7. Your Rights &amp; Choices</h2>
          <p className="mt-2 text-gray-700">Depending on your jurisdiction, you may have rights including access, rectification, deletion, portability, and restriction of processing. For residents of:</p>
          <ul className="mt-2 list-disc list-inside text-gray-700 space-y-2">
            <li><strong>GDPR (EU):</strong> right to access, rectify, erase, restrict processing, data portability, and object to processing.</li>
            <li><strong>CCPA (California):</strong> right to know, delete, and opt-out of sale of personal information (if applicable).</li>
            <li><strong>PIPEDA (Canada):</strong> similar privacy rights and access to personal information.</li>
          </ul>
          <p className="mt-2 text-gray-700">To exercise your rights, contact us at <a href="mailto:support@accountingfirm.com" className="text-blue-600">support@accountingfirm.com</a>. We may ask for verification to protect your data.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">8. Security</h2>
          <p className="mt-2 text-gray-700">We implement reasonable technical and organizational measures to protect personal data. This includes encryption in transit (TLS), access controls, audit logging, and periodic security reviews. No system is fully secure; in the event of a breach we will follow applicable notification requirements.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">9. International Transfers</h2>
          <p className="mt-2 text-gray-700">Our services may involve cross-border transfer of personal data. We rely on appropriate safeguards where required, such as standard contractual clauses or reliance on service providers located in compliant jurisdictions.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">10. Children</h2>
          <p className="mt-2 text-gray-700">Our services are intended for businesses and adults. We do not knowingly collect personal information from children under 16. If you believe we have collected such information, contact us to request deletion.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">11. Contact</h2>
          <p className="mt-2 text-gray-700">For privacy inquiries, requests, or complaints, contact us at:</p>
          <div className="mt-3 text-gray-700">
            <div>Accounting Firm</div>
            <div>Email: <a href="mailto:support@accountingfirm.com" className="text-blue-600">support@accountingfirm.com</a></div>
            <div>Website: <a href="https://yourfirm.com" className="text-blue-600">yourfirm.com</a></div>
          </div>
        </section>

        <section>
          <p className="text-sm text-gray-500">If you need to update any of this text for your specific jurisdiction, let us know and we can customize it further.</p>
          <div className="mt-4">
            <Link href="/" className="text-blue-600">Return to home</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
