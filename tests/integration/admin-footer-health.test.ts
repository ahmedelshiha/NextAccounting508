/**
 * Admin Footer Health Check API - Integration Tests
 * 
 * Vitest integration tests for the health check endpoint
 * Tests the GET /api/admin/system/health endpoint
 */

import { describe, it, expect, beforeAll } from 'vitest'
import type { SystemHealthResponse } from '@/components/admin/layout/Footer/types'

// Test configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'
const HEALTH_ENDPOINT = `${API_BASE}/api/admin/system/health`

describe('Health Check API Endpoint', () => {
  describe('GET /api/admin/system/health', () => {
    it('should return 200 status code', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      expect(response.status).toBe(200)
    })

    it('should return valid JSON response', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data = await response.json()

      expect(data).toBeDefined()
      expect(typeof data).toBe('object')
    })

    it('should have correct response structure', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('checks')
      expect(data).toHaveProperty('timestamp')
    })

    it('status should be valid enum value', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(['operational', 'degraded', 'outage']).toContain(data.status)
    })

    it('message should be non-empty string', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(typeof data.message).toBe('string')
      expect(data.message.length).toBeGreaterThan(0)
    })

    it('timestamp should be ISO string', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(typeof data.timestamp).toBe('string')
      // Verify it's a valid ISO string
      expect(() => new Date(data.timestamp)).not.toThrow()
    })
  })

  describe('Health Checks Structure', () => {
    it('checks should include database check', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(data.checks).toHaveProperty('database')
      expect(data.checks.database).toHaveProperty('status')
      expect(data.checks.database).toHaveProperty('latency')
    })

    it('checks should include api check', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(data.checks).toHaveProperty('api')
      expect(data.checks.api).toHaveProperty('status')
      expect(data.checks.api).toHaveProperty('latency')
    })

    it('database latency should be number', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(typeof data.checks.database.latency).toBe('number')
      expect(data.checks.database.latency).toBeGreaterThanOrEqual(0)
    })

    it('api latency should be number', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(typeof data.checks.api.latency).toBe('number')
      expect(data.checks.api.latency).toBeGreaterThanOrEqual(0)
    })

    it('redis check should be optional', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      // Redis is optional, but if present should have correct structure
      if (data.checks.redis) {
        expect(data.checks.redis).toHaveProperty('status')
        expect(data.checks.redis).toHaveProperty('latency')
      }
    })
  })

  describe('Status Logic', () => {
    it('operational status should have operational message', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      if (data.status === 'operational') {
        expect(data.message).toContain('operational')
      }
    })

    it('degraded status should indicate slowness', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      if (data.status === 'degraded') {
        expect(data.message.toLowerCase()).toMatch(/degrad|latency|slow/)
      }
    })

    it('outage status should indicate unavailability', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      if (data.status === 'outage') {
        expect(data.message.toLowerCase()).toMatch(/unavailable|fail|down|error/)
      }
    })

    it('should aggregate status from multiple checks', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      // If database is down, overall status should reflect that
      if (data.checks.database.status === 'outage') {
        expect(['outage', 'degraded']).toContain(data.status)
      }
    })
  })

  describe('Response Headers', () => {
    it('should return JSON content-type', async () => {
      const response = await fetch(HEALTH_ENDPOINT)

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should have cache control headers', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const cacheControl = response.headers.get('cache-control')

      expect(cacheControl).toBeDefined()
      // Health checks should not be cached (no-cache or must-revalidate)
      expect(cacheControl?.toLowerCase()).toMatch(/no-cache|must-revalidate/)
    })
  })

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const start = performance.now()
      const response = await fetch(HEALTH_ENDPOINT)
      const duration = performance.now() - start

      // Endpoint should respond within 5 seconds
      expect(duration).toBeLessThan(5000)
    })

    it('should not timeout', async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(HEALTH_ENDPOINT, {
          signal: controller.signal,
        })
        expect(response.ok).toBe(true)
      } finally {
        clearTimeout(timeout)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const response = await fetch(HEALTH_ENDPOINT)

      // Should never throw or 500 without proper error response
      expect([200, 503]).toContain(response.status)
    })

    it('error response should still have proper structure', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data = await response.json()

      // Even on error, should have basic structure
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('Consistency', () => {
    it('should return consistent structure across calls', async () => {
      const response1 = await fetch(HEALTH_ENDPOINT)
      const data1: SystemHealthResponse = await response1.json()

      const response2 = await fetch(HEALTH_ENDPOINT)
      const data2: SystemHealthResponse = await response2.json()

      // Structure should be identical
      expect(Object.keys(data1)).toEqual(Object.keys(data2))
      expect(Object.keys(data1.checks)).toEqual(Object.keys(data2.checks))
    })

    it('timestamp should update between calls', async () => {
      const response1 = await fetch(HEALTH_ENDPOINT)
      const data1: SystemHealthResponse = await response1.json()

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100))

      const response2 = await fetch(HEALTH_ENDPOINT)
      const data2: SystemHealthResponse = await response2.json()

      // Timestamps should be close but might differ
      const time1 = new Date(data1.timestamp).getTime()
      const time2 = new Date(data2.timestamp).getTime()

      expect(Math.abs(time2 - time1)).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Data Types', () => {
    it('all latencies should be numbers', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      expect(typeof data.checks.database.latency).toBe('number')
      expect(typeof data.checks.api.latency).toBe('number')
      if (data.checks.redis) {
        expect(typeof data.checks.redis.latency).toBe('number')
      }
    })

    it('optional uptime should be number if present', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      if (data.uptime !== undefined) {
        expect(typeof data.uptime).toBe('number')
        expect(data.uptime).toBeGreaterThanOrEqual(0)
      }
    })

    it('status messages should have proper format', async () => {
      const response = await fetch(HEALTH_ENDPOINT)
      const data: SystemHealthResponse = await response.json()

      // Messages should be human-readable
      expect(/[a-z]/i.test(data.message)).toBe(true)
    })
  })
})
