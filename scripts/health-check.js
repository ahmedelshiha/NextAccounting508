#!/usr/bin/env node

/**
 * Health Check Script for Admin Dashboard
 * Monitors admin routes and reports status
 */

const https = require('https')
const http = require('http')

const HEALTH_ENDPOINTS = [
  "/api/admin/health",
  "/admin",
  "/admin/analytics",
  "/admin/settings"
]
const BASE_URL = process.env.VERCEL_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

async function checkEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint}`
  const client = url.startsWith('https') ? https : http
  
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const req = client.request(url, { method: 'HEAD' }, (res) => {
      const responseTime = Date.now() - startTime
      resolve({
        endpoint,
        status: res.statusCode,
        responseTime,
        healthy: res.statusCode >= 200 && res.statusCode < 400
      })
    })
    
    req.on('error', (error) => {
      resolve({
        endpoint,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        healthy: false,
        error: error.message
      })
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      resolve({
        endpoint,
        status: 'TIMEOUT',
        responseTime: 5000,
        healthy: false,
        error: 'Request timeout'
      })
    })
    
    req.end()
  })
}

async function runHealthChecks() {
  console.log('🔍 Running admin dashboard health checks...')
  console.log(`Base URL: ${BASE_URL}`)
  console.log('\n' + '='.repeat(60) + '\n')
  
  const results = await Promise.all(
    HEALTH_ENDPOINTS.map(endpoint => checkEndpoint(endpoint))
  )
  
  let allHealthy = true
  
  results.forEach(result => {
    const status = result.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'
    const responseTime = `${result.responseTime}ms`
    
    console.log(`${status} | ${result.endpoint.padEnd(25)} | ${responseTime.padStart(8)} | ${result.status}`)
    
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    
    if (!result.healthy) {
      allHealthy = false
    }
  })
  
  console.log('\n' + '='.repeat(60))
  console.log(`Overall Status: ${allHealthy ? '✅ ALL SYSTEMS HEALTHY' : '⚠️  ISSUES DETECTED'}`)
  
  // Exit with error code if any checks failed
  process.exit(allHealthy ? 0 : 1)
}

if (require.main === module) {
  runHealthChecks().catch(console.error)
}

module.exports = { runHealthChecks, checkEndpoint }
