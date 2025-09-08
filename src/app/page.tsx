import { HeroSection } from '@/components/home/hero-section'
import { ServicesSection } from '@/components/home/services-section'
import { BlogSection } from '@/components/home/blog-section'
import TestimonialsLoader from '@/components/home/testimonials-loader'

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <TestimonialsLoader />
      <BlogSection />
    </main>
  )
}

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services. Book your free consultation today.',
  keywords: 'accounting, bookkeeping, tax preparation, payroll, CFO advisory, small business accounting',
}
