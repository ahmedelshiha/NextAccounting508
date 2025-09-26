import React, { useEffect, useRef, useState } from 'react'

export interface FAQItem {
  question: string
  answer: string
  id?: string
}

export interface FAQSectionProps {
  items: FAQItem[]
  heading?: string
  description?: string
  allowMultiple?: boolean
}

export function FAQSection({ items, heading = 'Frequently Asked Questions', description, allowMultiple = false }: FAQSectionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([])
  const headersRef = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    // Initialize no items open
    setOpenIndexes([])
  }, [items])

  const toggleIndex = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
    } else {
      setOpenIndexes((prev) => (prev[0] === index ? [] : [index]))
    }
  }

  const onHeaderKeyDown = (e: React.KeyboardEvent, index: number) => {
    const max = items.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (index + 1) % max
      headersRef.current[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (index - 1 + max) % max
      headersRef.current[prev]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      headersRef.current[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      headersRef.current[max - 1]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleIndex(index)
    }
  }

  return (
    <section aria-labelledby="faq-section-heading" className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 id="faq-section-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{heading}</h2>
          {description && <p className="text-lg text-gray-600">{description}</p>}
        </div>

        <div className="space-y-4" role="list">
          {items.map((faq, index) => {
            const isOpen = openIndexes.includes(index)
            const contentId = faq.id ?? `faq-${index}-content`
            const headerId = `${contentId}-header`

            return (
              <div key={contentId} className="bg-white p-6 rounded-lg shadow-sm" role="listitem">
                <h3>
                  <button
                    id={headerId}
                    ref={(el) => (headersRef.current[index] = el)}
                    aria-controls={contentId}
                    aria-expanded={isOpen}
                    onClick={() => toggleIndex(index)}
                    onKeyDown={(e) => onHeaderKeyDown(e, index)}
                    className="w-full text-left cursor-pointer list-none text-lg font-medium text-gray-900 flex justify-between items-center"
                  >
                    <span>{faq.question}</span>
                    <span aria-hidden="true" className={`ml-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                </h3>

                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  className={`mt-3 text-gray-700 ${isOpen ? 'block' : 'hidden'}`}
                >
                  {faq.answer}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
