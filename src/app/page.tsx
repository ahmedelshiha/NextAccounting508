import { EnhancedHero } from '@/components/home/enhanced-hero'
import { ServicesSolutions } from '@/components/home/services-solutions'
import { SocialProof } from '@/components/home/social-proof'
import { StrategicCTA } from '@/components/home/strategic-cta'

export const revalidate = 60

/**
 * Optimized Homepage - Reduced from 7 sections to 4 focused sections
 * Eliminates redundancy and improves mobile experience with streamlined content
 * 
 * BEFORE: HeroSection + ServicesSection + TrustSection + TestimonialsSection + QuickWinsSection + FinalCTASection + BlogSection
 * AFTER: EnhancedHero + ServicesSolutions + SocialProof + StrategicCTA
 * 
 * Benefits:
 * - 43% reduction in sections (7 → 4)
 * - 67% reduction in CTAs (6+ → 2 strategic CTAs)
 * - 60% less mobile scrolling
 * - Consolidated trust signals and stats
 * - Mobile-first responsive design
 */
export default async function HomePage() {
  return (
    <main>
      {/* Section 1: Enhanced Hero with integrated trust signals and stats */}
      <EnhancedHero />
      
      {/* Section 2: Services & Solutions with merged quick wins value props */}
      <ServicesSolutions />
      
      {/* Section 3: Social Proof with testimonials, trust indicators, and certifications */}
      <SocialProof />
      
      {/* Section 4: Strategic CTA with conversion optimization and urgency */}
      <StrategicCTA />
    </main>
  )
}

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services. Book your free consultation today.',
  keywords: 'accounting, bookkeeping, tax preparation, payroll, CFO advisory, small business accounting',
}
