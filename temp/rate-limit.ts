import { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (in production, use Redis or similar)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator } = options

  return function rateLimitMiddleware(req: NextRequest) {
    // Generate key for rate limiting (default: IP address)
    const key = keyGenerator ? keyGenerator(req) : getClientIP(req)
    
    const now = Date.now()
    const windowStart = now - windowMs

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      }
    }

    // Check if request is within the current window
    if (store[key].resetTime > now) {
      store[key].count++
      
      if (store[key].count > maxRequests) {
        const resetTime = Math.ceil((store[key].resetTime - now) / 1000)
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime,
          error: `Too many requests. Try again in ${resetTime} seconds.`
        }
      }
    }

    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - store[key].count),
      resetTime: Math.ceil((store[key].resetTime - now) / 1000)
    }
  }
}

function getClientIP(req: NextRequest): string {
  // Try to get IP from various headers (for different proxy setups)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a default value
  return 'unknown'
}

// Predefined rate limiters for different use cases
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 login attempts per 15 minutes
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
})

export const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3 // 3 contact form submissions per hour
})

export const bookingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10 // 10 booking attempts per hour
})

