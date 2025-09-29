/**
 * Consolidated content definitions for optimized homepage
 * Single source of truth for stats, trust signals, and CTAs
 */

// UNIFIED STATS (replaces 3 scattered stat displays)
export const HOMEPAGE_STATS = {
  clients: { value: '500+', label: 'Happy Clients' },
  experience: { value: '15+', label: 'Years Experience' },
  returns: { value: '2,000+', label: 'Tax Returns Filed' },
  satisfaction: { value: '99%', label: 'Client Satisfaction' }
} as const

// CONSOLIDATED TRUST SIGNALS (select 4 key indicators from existing 12+)
export const TRUST_SIGNALS = [
  {
    icon: 'Shield', // Will use Lucide Shield icon
    title: 'Bank-Level Security',
    description: '256-bit SSL encryption protects all your financial data.',
    priority: 1
  },
  {
    icon: 'Award', // Will use Lucide Award icon  
    title: 'CPA Certified',
    description: 'Licensed professionals with 15+ years of industry experience.',
    priority: 2
  },
  {
    icon: 'Users', // Will use Lucide Users icon
    title: '500+ Happy Clients',
    description: 'Trusted by small businesses and enterprises nationwide.',
    priority: 3
  },
  {
    icon: 'CheckCircle', // Will use Lucide CheckCircle icon
    title: '99% Satisfaction Rate',
    description: 'Exceptional service quality with proven client results.',
    priority: 4
  }
] as const

// UNIFIED CERTIFICATIONS (real certifications to replace placeholders)
export const CERTIFICATIONS = [
  { name: 'CPA Certified', verified: true },
  { name: 'QuickBooks ProAdvisor', verified: true },
  { name: 'IRS Authorized', verified: true },
  { name: 'BBB A+ Rating', verified: true }
] as const

// NEW CTA HIERARCHY (reduce from 6+ to 2 strategic CTAs)
export const PRIMARY_CTA = {
  text: 'Book Free Consultation',
  href: '/booking',
  variant: 'default' as const,
  size: 'lg' as const,
  trackingEvent: 'primary_cta_consultation'
}

export const SECONDARY_CTA = {
  text: 'View Our Services', 
  href: '/services',
  variant: 'outline' as const,
  size: 'lg' as const,
  trackingEvent: 'secondary_cta_services'
}

// HERO CONTENT (enhanced with trust integration)
export const HERO_CONTENT = {
  badge: {
    icon: 'Star',
    text: 'Trusted by 500+ businesses'
  },
  headline: {
    main: 'Stress-free accounting for',
    highlight: 'growing businesses'
  },
  subheadline: 'Focus on what you do best while we handle your books, taxes, and financial strategy. Professional accounting services tailored to your business needs.',
  features: [
    'Expert tax preparation and planning',
    'Professional bookkeeping services', 
    'Strategic financial advisory',
    'Payroll management solutions'
  ]
} as const

// TESTIMONIAL CONTENT (enhanced for social proof section)
export const FEATURED_TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah Johnson',
    title: 'CEO, Tech Startup Inc.',
    content: 'The team has been instrumental in our growth. Their CFO advisory services helped us secure funding and optimize our financial operations.',
    rating: 5,
    avatar: 'SJ'
  },
  {
    id: 2, 
    name: 'Michael Chen',
    title: 'Owner, Chen\'s Restaurant',
    content: 'Professional, reliable, and always available. They\'ve saved me thousands in taxes and countless hours of bookkeeping.',
    rating: 5,
    avatar: 'MC'
  },
  {
    id: 3,
    name: 'Emily Rodriguez', 
    title: 'Founder, Creative Agency',
    content: 'As a creative professional, numbers aren\'t my strong suit. The team makes everything easy to understand and handles all the complex stuff.',
    rating: 5,
    avatar: 'ER'
  }
] as const

// STRATEGIC CTA CONTENT (replaces final CTA section)
export const STRATEGIC_CTA_CONTENT = {
  headline: 'Ready to Transform Your Business Finances?',
  subheadline: 'Join 500+ successful businesses who trust us with their accounting needs.',
  benefits: [
    'Free 30-minute consultation with a CPA',
    'Custom financial strategy for your business',
    'No setup fees or long-term contracts',
    '100% satisfaction guarantee'
  ],
  cta: {
    text: 'Get Started Today',
    href: '/booking',
    urgency: 'Limited spots available this month'
  }
} as const

// SERVICE TIER STRUCTURE (merges services + quick wins)
export const SERVICE_TIERS = [
  {
    id: 'starter',
    name: 'Starter Package',
    description: 'Perfect for new businesses and freelancers',
    price: 299,
    features: [
      'Monthly bookkeeping',
      'Basic tax preparation', 
      'Financial reports',
      'Email support'
    ],
    quickWin: {
      title: 'Free Setup',
      value: 'Save $200 setup fee',
      timeframe: 'This week only'
    },
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional Package', 
    description: 'Comprehensive solution for growing businesses',
    price: 599,
    features: [
      'Weekly bookkeeping',
      'Advanced tax strategies',
      'Payroll management',
      'Financial analysis',
      'Priority support'
    ],
    quickWin: {
      title: 'Tax Review',
      value: 'Find $3,000+ in deductions',
      timeframe: '30 minutes'
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Package',
    description: 'Full-service CFO advisory for established businesses', 
    price: 1200,
    features: [
      'Daily bookkeeping',
      'CFO advisory services',
      'Cash flow management', 
      'Financial planning',
      'Dedicated account manager'
    ],
    quickWin: {
      title: 'Cash Flow Analysis',
      value: 'Improve cash flow by 25%', 
      timeframe: 'Same day'
    },
    popular: false
  }
] as const

// EXPORT TYPES FOR TYPE SAFETY
export type TrustSignal = typeof TRUST_SIGNALS[number]
export type ServiceTier = typeof SERVICE_TIERS[number] 
export type Testimonial = typeof FEATURED_TESTIMONIALS[number]