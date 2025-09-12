import { HeroSection as HomeHeroSection } from '@/components/home/hero-section'
import { HeroSection } from '@/components/home/hero-section'
import { ServicesSection } from '@/components/home/services-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { Suspense } from 'react'
import { BlogSection } from '@/components/home/blog-section'

export const revalidate = 60

export default function HomePage() {
  return (
    <main>
      <HomeHeroSection />
      <ServicesSection />
      <TestimonialsSection />
      <Suspense fallback={null}>
        <BlogSection />
      </Suspense>
    </main>
  )
}

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services. Book your free consultation today.',
  keywords: 'accounting, bookkeeping, tax preparation, payroll, CFO advisory, small business accounting',
}
