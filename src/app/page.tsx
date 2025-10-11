import { HeroSection } from '@/components/home/hero-section'
import { CompactHero } from '@/components/home/compact-hero'
import { ServicesSection } from '@/components/home/services-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { Suspense } from 'react'
import { BlogSection } from '@/components/home/blog-section'
import { cookies } from 'next/headers'

export const revalidate = 60

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const heroParam = typeof sp?.hero === 'string' ? String(sp.hero) : Array.isArray(sp?.hero) ? sp?.hero?.[0] : undefined
  const cookieStore = await cookies()
  const heroCookie = cookieStore.get('hero')?.value
  const useCompact = (heroParam ?? heroCookie) === 'compact'

  return (
    <main>
      {useCompact ? <CompactHero /> : <HeroSection />}
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
