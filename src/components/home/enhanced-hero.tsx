'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HERO_CONTENT, PRIMARY_CTA, SECONDARY_CTA, HOMEPAGE_STATS } from '@/lib/homepage-content'
import { trackEvent } from '@/lib/analytics'

/**
 * Enhanced Hero Component - Consolidates hero content with trust signals
 * Replaces both HeroSection and CompactHero with unified, mobile-first design
 * Integrates key trust indicators directly in hero to reduce page sections
 */
export function EnhancedHero() {
  const handlePrimaryCTA = () => {
    trackEvent('cta_clicked', { 
      source: 'hero_primary',
      cta_text: PRIMARY_CTA.text,
      event_name: PRIMARY_CTA.trackingEvent
    })
  }

  const handleSecondaryCTA = () => {
    trackEvent('cta_clicked', { 
      source: 'hero_secondary',
      cta_text: SECONDARY_CTA.text,
      event_name: SECONDARY_CTA.trackingEvent
    })
  }

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 lg:py-12">
      {/* Background Pattern for Visual Interest */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" aria-hidden="true"></div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Content Column - Mobile First */}
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            
            {/* Trust Badge - Prominent Placement */}
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>{HERO_CONTENT.badge.text}</span>
            </div>

            {/* Main Headline - Optimized Hierarchy */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
              {HERO_CONTENT.headline.main}{' '}
              <span className="text-blue-600">{HERO_CONTENT.headline.highlight}</span>
            </h1>

            {/* Subheadline - Clear Value Proposition */}
            <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed">
              {HERO_CONTENT.subheadline}
            </p>

            {/* Feature Benefits - Mobile Optimized Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {HERO_CONTENT.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                </div>
              ))}
            </div>

            {/* Strategic CTA Buttons - Hierarchy Clear */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                size={PRIMARY_CTA.size} 
                variant={PRIMARY_CTA.variant}
                asChild 
                className="group min-h-[44px]" /* Ensure mobile touch target */
                onClick={handlePrimaryCTA}
              >
                <Link href={PRIMARY_CTA.href}>
                  {PRIMARY_CTA.text}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
              </Button>
              
              <Button 
                size={SECONDARY_CTA.size} 
                variant={SECONDARY_CTA.variant}
                asChild
                className="min-h-[44px]" /* Ensure mobile touch target */
                onClick={handleSecondaryCTA}
              >
                <Link href={SECONDARY_CTA.href}>
                  {SECONDARY_CTA.text}
                </Link>
              </Button>
            </div>

            {/* Integrated Stats - Single Source of Truth */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
              {Object.values(HOMEPAGE_STATS).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Column - Enhanced Dashboard Mockup */}
          <div className="relative mt-8 lg:mt-0">
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 transform hover:rotate-0 transition-transform duration-300 lg:rotate-2">
              
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Financial Dashboard
                </h3>
                <div className="flex space-x-1" aria-label="Dashboard controls">
                  <div className="w-3 h-3 bg-red-400 rounded-full" aria-hidden="true"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" aria-hidden="true"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full" aria-hidden="true"></div>
                </div>
              </div>
              
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">$125K</div>
                  <div className="text-sm text-green-700">Revenue</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">$89K</div>
                  <div className="text-sm text-blue-700">Expenses</div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tax Savings</span>
                  <span className="text-sm font-medium text-gray-900">$12,500</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: '75%' }}
                    role="progressbar" 
                    aria-valuenow={75} 
                    aria-valuemin={0} 
                    aria-valuemax={100}
                    aria-label="Tax savings progress"
                  ></div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                  <span>Books reconciled for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Floating Success Indicators */}
            <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg">
              <div className="text-xs font-medium">Tax Deadline</div>
              <div className="text-lg font-bold">Apr 15</div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-green-500 text-white p-3 rounded-lg shadow-lg">
              <div className="text-xs font-medium">Avg. Savings</div>
              <div className="text-lg font-bold">$15K</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}