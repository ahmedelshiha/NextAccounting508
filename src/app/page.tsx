import dynamic from 'next/dynamic'
import { HeroSection } from '@/components/home/hero-section'
import { ServicesSection } from '@/components/home/services-section'
import { BlogSection } from '@/components/home/blog-section'

const TestimonialsSection = dynamic(
  () => import('@/components/home/testimonials-section').then((mod) => mod.TestimonialsSection),
  { ssr: false, loading: () => <div aria-hidden className="py-12 sm:py-16 bg-gray-50"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">Loading testimonials...</div></div> }
)

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <TestimonialsSection />
      <BlogSection />
    </main>
  )
}

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services. Book your free consultation today.',
  keywords: 'accounting, bookkeeping, tax preparation, payroll, CFO advisory, small business accounting',
}
