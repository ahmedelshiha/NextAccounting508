# Homepage Component Structure Analysis

## Current Page Structure (`src/app/page.tsx`)

### Component Imports:
```typescript
import { HeroSection as HomeHeroSection } from '@/components/home/hero-section'
import { CompactHero } from '@/components/home/compact-hero'
import { ServicesSection } from '@/components/home/services-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { BlogSection } from '@/components/home/blog-section'
import { TrustSection } from '@/components/home/TrustSection'
import { QuickWinsSection } from '@/components/home/quick-wins'
import { FinalCTASection } from '@/components/home/final-cta'
```

### Component Rendering Order:
1. **Conditional Hero**: `useCompact ? <CompactHero /> : <HomeHeroSection />`
2. **ServicesSection**: Core services display with API integration
3. **TrustSection**: Security/certification trust signals
4. **TestimonialsSection**: Client testimonials with carousel
5. **QuickWinsSection**: Quick value propositions
6. **FinalCTASection**: Final conversion CTA
7. **BlogSection**: Latest blog posts (Suspense wrapped)

## Component Dependencies Analysis

### HeroSection (`hero-section.tsx`)
- **Props**: None (self-contained)
- **Dependencies**: Lucide icons, UI components
- **Features**: Stats display, feature list, CTA buttons, mock dashboard
- **Content**: Trust badge, headline, feature bullets, dual CTAs

### CompactHero (`compact-hero.tsx`)
- **Props**: None (self-contained)  
- **Dependencies**: Lucide icons, UI components
- **Features**: Compact layout, trust indicators, single dashboard mockup
- **Content**: Shorter headline, dual CTAs, quick benefits

### ServicesSection (`services-section.tsx`)
- **Props**: None (uses API)
- **Dependencies**: apiFetch, formatCurrencyFromDecimal, UI components
- **Features**: API integration, loading states, pricing display
- **Content**: Service cards, custom quote CTA, view all services CTA

### TrustSection (`TrustSection.tsx`)
- **Props**: None (self-contained)
- **Dependencies**: Lucide icons, UI components  
- **Features**: Trust indicators, certifications, security notice
- **Content**: 4 trust cards, certification list, security statement

### TestimonialsSection (`testimonials-section.tsx`)
- **Props**: None (self-contained)
- **Dependencies**: useState, useEffect, UI components
- **Features**: Auto-rotating carousel, manual navigation
- **Content**: 5 testimonials, trust stats, navigation controls

### QuickWinsSection (`quick-wins.tsx`)
- **Props**: None (self-contained)
- **Dependencies**: trackEvent analytics, UI components
- **Features**: 3 quick win cards, analytics tracking
- **Content**: Tax review, bookkeeping cleanup, cash flow analysis

### FinalCTASection (`final-cta.tsx`)
- **Props**: None (self-contained)
- **Dependencies**: trackEvent analytics, UI components
- **Features**: Single powerful CTA, benefit list
- **Content**: Free analysis offer, benefit checkmarks

### BlogSection (`blog-section.tsx`)
- **Props**: None (uses Prisma)
- **Dependencies**: Prisma, BlogCard component
- **Features**: Database integration, fallback content, revalidation
- **Content**: 3 latest blog posts, view all CTA

## Shared Dependencies
- **UI Components**: Button, Card, Badge (from @/components/ui)
- **Lucide Icons**: Various icons across all components
- **Next.js**: Link component for navigation
- **Analytics**: trackEvent function (in Quick Wins and Final CTA)
- **API Integration**: apiFetch (Services), Prisma (Blog)

## Redundancy Issues Identified

### Stats Repetition:
1. **HeroSection**: "500+ businesses, 15+ years, 2,000+ returns, 99% satisfaction"
2. **TestimonialsSection**: "500+ clients, 99% satisfaction, 15+ years, 24/7 support"  
3. **TrustSection**: Implied through trust indicators

### CTA Overload:
1. **Hero**: "Book Free Consultation" + "View Our Services"
2. **Services**: "Learn More" (4x) + "Get Custom Quote" + "View All Services"
3. **Quick Wins**: "Get Free Review" + "Start Cleanup" + "Get Analysis"
4. **Final CTA**: "Claim My Free Analysis"
5. **Blog**: "View All Articles"

### Trust Signal Duplication:
1. **Hero**: Trust badge "Trusted by 500+ businesses"
2. **TrustSection**: Security, certifications, client count
3. **TestimonialsSection**: Client testimonials + stats

## Optimization Opportunities

### Content Consolidation:
- **Single Stats Source**: Use one comprehensive stats display
- **Unified Trust Signals**: Combine security + testimonials + certifications
- **CTA Hierarchy**: Primary (Book Consultation) + Secondary (View Services)

### Component Merging:
- **Services + Quick Wins**: Unified value proposition cards
- **Trust + Testimonials**: Single social proof section
- **Hero Enhancement**: Include key trust signals directly

### Mobile Optimization:
- **Vertical Space**: Reduce 7 sections to 4 sections
- **Touch Targets**: Ensure 44px minimum touch areas
- **Loading Performance**: Reduce component count and bundle size