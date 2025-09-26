import React from 'react'

export function SchemaMarkup() {
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    name: 'Accounting Firm',
    description:
      'Professional accounting services including bookkeeping, tax preparation, and CFO advisory for growing businesses.',
    url: 'https://accountingfirm.com',
    telephone: '+1-555-123-4567',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Business Ave, Suite 100',
      addressLocality: 'City',
      addressRegion: 'State',
      postalCode: '12345',
      addressCountry: 'US'
    },
    openingHours: ['Mo-Fr 08:00-18:00', 'Sa 09:00-14:00'],
    priceRange: '$299-$1200',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127'
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Bookkeeping Services',
        price: '299',
        priceCurrency: 'USD',
        description: 'Monthly bookkeeping and reconciliation services'
      },
      {
        '@type': 'Offer',
        name: 'Tax Preparation',
        price: '450',
        priceCurrency: 'USD',
        description: 'Professional tax preparation and filing'
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
    />
  )
}
