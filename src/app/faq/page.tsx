import Link from 'next/link'
import { Button } from '@/components/ui/button'

const faqs = [
  {
    question: 'What services do you offer?',
    answer:
      'We provide bookkeeping, tax preparation, payroll management, and CFO advisory services tailored for growing businesses. Learn more on our Services page or contact us for a custom plan.',
  },
  {
    question: 'How do I get started with your firm?',
    answer:
      'Book a free consultation using the "Book Consultation" button, or send us a message on the Contact page. We will review your needs and recommend the best service package.',
  },
  {
    question: 'What are your pricing and billing options?',
    answer:
      'We offer transparent pricing based on the scope of work. Some services use flat monthly fees while others are billed per-project. During your consultation we will provide a clear proposal and payment terms.',
  },
  {
    question: 'How do you protect my financial data?',
    answer:
      'We use industry-standard security practices including encrypted data transmission, secure storage, and access controls. We also limit staff access on a need-to-know basis and maintain confidentiality agreements for all team members.',
  },
  {
    question: 'Can you work with my existing accounting software?',
    answer:
      'Yes — we commonly integrate with QuickBooks, Xero, and other popular accounting platforms. If you use a different system, let us know and we will evaluate the best integration approach.',
  },
  {
    question: 'Do you offer services for international businesses?',
    answer:
      'Yes. We have experience working with international entities and cross-border tax matters. Please contact us to discuss your specific jurisdiction and compliance requirements.',
  },
]

export default function FAQPage() {
  const jsonLd = {
    "@context": 'https://schema.org',
    "@type": 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#faq-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-3 py-2 rounded"
      >
        Skip to FAQ
      </a>


      <main id="faq-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-gray-600">
            Answers to common questions about our services, pricing, and processes. If you can&apos;t find
            what you&apos;re looking for, please get in touch.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            {/* Reusable FAQSection component */}
            <FAQSection items={faqs} heading="Frequently Asked Questions" description="Answers to common questions about our services, pricing, and processes. If you can't find what you're looking for, please get in touch." />
          </div>

          <aside className="hidden md:block">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Need more help?</h3>
              <p className="text-gray-700 mb-4">Reach out to our team and we&apos;ll get back to you within 1 business day.</p>
              <div>
                <Button asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Popular Services</h4>
              <ul className="space-y-2 text-gray-700">
                <li>
                  <Link href="/services/bookkeeping" className="text-blue-600 hover:underline">
                    Bookkeeping
                  </Link>
                </li>
                <li>
                  <Link href="/services/tax-preparation" className="text-blue-600 hover:underline">
                    Tax Preparation
                  </Link>
                </li>
                <li>
                  <Link href="/services/payroll" className="text-blue-600 hover:underline">
                    Payroll Management
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </section>

      </main>
    </div>
  )
}
