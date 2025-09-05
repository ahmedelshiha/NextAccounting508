import { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

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
    const key = keyGenerator ? keyGenerator(req) : getClientIP(req)
    
    const now = Date.now()

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      }
    }

    if (store[key].resetTime > now) {
      store[key].count++
      
      if (store[key].count > maxRequests) {
        const resetTime = Math.ceil((store[key].resetTime - now) / 1000)
        return {
          success: false as const,
          limit: maxRequests,
          remaining: 0,
          resetTime,
          error: `Too many requests. Try again in ${resetTime} seconds.`
        }
      }
    }

    return {
      success: true as const,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - store[key].count),
      resetTime: Math.ceil((store[key].resetTime - now) / 1000)
    }
  }
}

function getClientIP(req: NextRequest): string {
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
  return 'unknown'
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100
})

export const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3
})

export const bookingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10
})
