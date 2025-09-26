#!/usr/bin/env node

/**
 * Production Monitoring Setup Script
 * Sets up performance monitoring, analytics, and health checks for admin dashboard
 * 
 * Usage: node scripts/production-monitoring.js
 */

const fs = require('fs')
const path = require('path')

const MONITORING_CONFIG = {
  // Performance thresholds for alerts
  performance: {
    firstLoadTime: 3000, // 3 seconds
    navigationTime: 500,  // 500ms
    sidebarToggle: 100,   // 100ms
    errorRate: 0.01,      // 1% error rate
    memoryUsage: 100,     // 100MB
  },
  
  // Analytics configuration
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    sentryDsn: process.env.SENTRY_DSN,
    trackingEvents: [
      'admin_performance',
      'admin_navigation', 
      'admin_interaction',
      'admin_error',
      'admin_session_start',
      'admin_session_end'
    ]
  },

  // Health check endpoints
  healthChecks: [
    '/api/admin/health',
    '/admin',
    '/admin/analytics',
    '/admin/settings'
  ]
}

/**
 * Create monitoring configuration files
 */
function createMonitoringConfig() {
  // Create monitoring directory if it doesn't exist
  const monitoringDir = path.join(process.cwd(), 'monitoring')
  if (!fs.existsSync(monitoringDir)) {
    fs.mkdirSync(monitoringDir, { recursive: true })
  }

  // Write monitoring configuration
  const configPath = path.join(monitoringDir, 'config.json')
  fs.writeFileSync(configPath, JSON.stringify(MONITORING_CONFIG, null, 2))
  
  console.log('✅ Created monitoring configuration:', configPath)

  // Create performance baseline file
  const baselinePath = path.join(monitoringDir, 'performance-baseline.json')
  const baseline = {
    timestamp: new Date().toISOString(),
    metrics: {
      firstLoadTime: null,
      navigationTime: null, 
      sidebarToggle: null,
      bundleSize: {
        adminComponents: null,
        adminUtils: null,
        uiComponents: null,
        total: null
      },
      lighthouse: {
        performance: null,
        accessibility: null,
        bestPractices: null,
        seo: null
      }
    },
    notes: 'Baseline metrics to be populated after first production deployment'
  }
  
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2))
  console.log('✅ Created performance baseline template:', baselinePath)
}

/**
 * Create health check monitoring script
 */
function createHealthCheckScript() {
  const healthCheckScript = `#!/usr/bin/env node

/**
 * Health Check Script for Admin Dashboard
 * Monitors admin routes and reports status
 */

const https = require('https')
const http = require('http')

const HEALTH_ENDPOINTS = ${JSON.stringify(MONITORING_CONFIG.healthChecks, null, 2)}
const BASE_URL = process.env.VERCEL_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

async function checkEndpoint(endpoint) {
  const url = \`\${BASE_URL}\${endpoint}\`
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
  console.log(\`Base URL: \${BASE_URL}\`)
  console.log('\\n' + '='.repeat(60) + '\\n')
  
  const results = await Promise.all(
    HEALTH_ENDPOINTS.map(endpoint => checkEndpoint(endpoint))
  )
  
  let allHealthy = true
  
  results.forEach(result => {
    const status = result.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'
    const responseTime = \`\${result.responseTime}ms\`
    
    console.log(\`\${status} | \${result.endpoint.padEnd(25)} | \${responseTime.padStart(8)} | \${result.status}\`)
    
    if (result.error) {
      console.log(\`   Error: \${result.error}\`)
    }
    
    if (!result.healthy) {
      allHealthy = false
    }
  })
  
  console.log('\\n' + '='.repeat(60))
  console.log(\`Overall Status: \${allHealthy ? '✅ ALL SYSTEMS HEALTHY' : '⚠️  ISSUES DETECTED'}\`)
  
  // Exit with error code if any checks failed
  process.exit(allHealthy ? 0 : 1)
}

if (require.main === module) {
  runHealthChecks().catch(console.error)
}

module.exports = { runHealthChecks, checkEndpoint }
`

  const healthCheckPath = path.join(process.cwd(), 'scripts', 'health-check.js')
  fs.writeFileSync(healthCheckPath, healthCheckScript)
  fs.chmodSync(healthCheckPath, '755') // Make executable
  
  console.log('✅ Created health check script:', healthCheckPath)
}

/**
 * Create performance monitoring dashboard template
 */
function createDashboardTemplate() {
  const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Performance Monitoring</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #0070f3; }
        .metric-label { color: #666; margin-top: 5px; }
        .status-good { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-error { color: #ef4444; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); height: 300px; display: flex; align-items: center; justify-content: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Admin Dashboard Performance Monitoring</h1>
            <p>Real-time performance metrics and system health for NextAccounting admin dashboard</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value status-good" id="load-time">--</div>
                <div class="metric-label">Average Load Time (ms)</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value status-good" id="navigation-time">--</div>
                <div class="metric-label">Navigation Time (ms)</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value status-good" id="error-rate">--</div>
                <div class="metric-label">Error Rate (%)</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value status-good" id="active-users">--</div>
                <div class="metric-label">Active Admin Users</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value status-good" id="bundle-size">--</div>
                <div class="metric-label">Admin Bundle Size (KB)</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-value status-good" id="uptime">--</div>
                <div class="metric-label">System Uptime (%)</div>
            </div>
        </div>
        
        <div class="chart-container">
            <p>Performance charts will be integrated here<br>
            Consider using Chart.js, D3.js, or a monitoring service like Grafana</p>
        </div>
    </div>
    
    <script>
        // Placeholder for real-time monitoring data
        // Connect to your analytics API, Google Analytics, or monitoring service
        
        function updateMetrics() {
            // Example: Update with real data from your monitoring system
            document.getElementById('load-time').textContent = Math.floor(Math.random() * 1000 + 500)
            document.getElementById('navigation-time').textContent = Math.floor(Math.random() * 200 + 100)
            document.getElementById('error-rate').textContent = (Math.random() * 2).toFixed(2)
            document.getElementById('active-users').textContent = Math.floor(Math.random() * 50 + 10)
            document.getElementById('bundle-size').textContent = Math.floor(Math.random() * 50 + 150)
            document.getElementById('uptime').textContent = (99.5 + Math.random() * 0.5).toFixed(2)
        }
        
        // Update metrics every 30 seconds
        setInterval(updateMetrics, 30000)
        updateMetrics() // Initial update
        
        console.log('📊 Performance monitoring dashboard loaded')
        console.log('Connect this to your real monitoring data source')
    </script>
</body>
</html>`

  const monitoringDir = path.join(process.cwd(), 'monitoring')
  const dashboardPath = path.join(monitoringDir, 'dashboard.html')
  fs.writeFileSync(dashboardPath, dashboardHtml)
  
  console.log('✅ Created monitoring dashboard template:', dashboardPath)
}

/**
 * Main setup function
 */
function setupProductionMonitoring() {
  console.log('🚀 Setting up production monitoring for admin dashboard...\n')
  
  try {
    createMonitoringConfig()
    createHealthCheckScript()
    createDashboardTemplate()
    
    console.log('\n✅ Production monitoring setup complete!')
    console.log('\nNext steps:')
    console.log('1. Review monitoring/config.json and customize thresholds')
    console.log('2. Set up environment variables (NEXT_PUBLIC_GA_ID, SENTRY_DSN)')
    console.log('3. Run health checks: node scripts/health-check.js')
    console.log('4. Open monitoring/dashboard.html for performance tracking')
    console.log('5. Integrate with your preferred monitoring service (Grafana, DataDog, etc.)')
    
  } catch (error) {
    console.error('❌ Error setting up monitoring:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  setupProductionMonitoring()
}

module.exports = {
  setupProductionMonitoring,
  MONITORING_CONFIG
}