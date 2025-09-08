'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const Testimonials = dynamic(
  () => import('./testimonials-section').then((mod) => mod.TestimonialsSection),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden className="py-12 sm:py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">Loading testimonials...</div>
      </div>
    ),
  }
)

export default function TestimonialsLoader() {
  return <Testimonials />
}
