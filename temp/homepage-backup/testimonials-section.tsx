'use client'


import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    title: 'CEO, Tech Startup Inc.',
    content: 'The team at Accounting Firm has been instrumental in our growth. Their CFO advisory services helped us secure funding and optimize our financial operations. Highly recommended!',
    rating: 5,
    image: '/api/placeholder/64/64'
  },
  {
    id: 2,
    name: 'Michael Chen',
    title: 'Owner, Chen\'s Restaurant',
    content: 'Professional, reliable, and always available when I need them. They\'ve saved me thousands in taxes and countless hours of bookkeeping. Best investment I\'ve made for my business.',
    rating: 5,
    image: '/api/placeholder/64/64'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    title: 'Founder, Creative Agency',
    content: 'As a creative professional, numbers aren\'t my strong suit. The Accounting Firm team makes everything so easy to understand and handles all the complex stuff. I can focus on what I love doing.',
    rating: 5,
    image: '/api/placeholder/64/64'
  },
  {
    id: 4,
    name: 'David Thompson',
    title: 'Director, Manufacturing Co.',
    content: 'Their payroll management service is flawless. Never had an issue with payments or tax filings. The team is knowledgeable and responsive. Great value for the service provided.',
    rating: 5,
    image: '/api/placeholder/64/64'
  },
  {
    id: 5,
    name: 'Lisa Park',
    title: 'Owner, Retail Boutique',
    content: 'I was drowning in receipts and financial paperwork before finding this team. Now my books are always up to date, and I have clear insights into my business performance. Life-changing!',
    rating: 5,
    image: '/api/placeholder/64/64'
  }
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance testimonials
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  return (
    <section className="py-8 sm:py-10 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            What Our Clients Say
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Don&apos;t just take our word for it. Here&apos;s what business owners say about
            working with our accounting team.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-3xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                {/* Quote Icon */}
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Quote className="h-6 w-6 text-blue-600" />
                </div>

                {/* Stars */}
                <div className="flex justify-center space-x-1 mb-4">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial Content */}
                <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 italic max-w-2xl mx-auto">
                  &ldquo;{testimonials[currentIndex].content}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-sm">
                      {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonials[currentIndex].title}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous testimonial"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white shadow hover:bg-gray-50"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label="Next testimonial"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white shadow hover:bg-gray-50"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-4">
            {testimonials.map((_, index) => (
              <button
                key={index}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-pressed={index === currentIndex}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600 mb-1">500+</div>
            <div className="text-sm text-gray-600">Happy Clients</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 mb-1">99%</div>
            <div className="text-sm text-gray-600">Satisfaction Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 mb-1">15+</div>
            <div className="text-sm text-gray-600">Years Experience</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 mb-1">24/7</div>
            <div className="text-sm text-gray-600">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  )
}
