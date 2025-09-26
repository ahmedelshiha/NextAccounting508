// dev-server.js - Managed development server with auto-restart
const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class DevServerManager {
  constructor() {
    this.server = null
    this.restartTimeout = null
    this.restartCount = 0
    this.maxRestarts = 5
    this.port = process.env.PORT || 3000
    this.host = '0.0.0.0'
  }

  start() {
    console.log(`🚀 Starting development server on http://${this.host}:${this.port}`)

    if (this.server) {
      this.kill()
    }

    const env = {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
      NEXT_TELEMETRY_DISABLED: '1',
    }

    // Prefer pnpm exec to avoid arg forwarding issues
    this.server = spawn(
      'pnpm',
      ['exec', 'next', 'dev', '-p', String(this.port), '-H', this.host],
      {
        stdio: 'inherit',
        env,
        shell: true,
      }
    )

    this.server.on('error', (error) => {
      console.error('❌ Server error:', error)
      this.handleRestart()
    })

    this.server.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`⚠️ Server exited with code ${code}`)
        this.handleRestart()
      }
    })

    setTimeout(() => {
      if (this.server && !this.server.killed) {
        this.restartCount = 0
        console.log('✅ Server started successfully')
      }
    }, 10_000)
  }

  kill() {
    if (this.server && !this.server.killed) {
      console.log('🛑 Stopping server...')
      this.server.kill('SIGTERM')
      setTimeout(() => {
        if (this.server && !this.server.killed) {
          this.server.kill('SIGKILL')
        }
      }, 5_000)
    }
  }

  handleRestart() {
    if (this.restartCount >= this.maxRestarts) {
      console.error('❌ Max restart attempts reached. Please fix the issues and restart manually.')
      process.exit(1)
    }

    this.restartCount++
    console.log(`🔄 Restarting server (attempt ${this.restartCount}/${this.maxRestarts})...`)

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
    }

    this.restartTimeout = setTimeout(() => {
      this.start()
    }, 3_000)
  }

  watchForChanges() {
    const candidates = [
      'next.config.js',
      'next.config.mjs',
      'package.json',
      'tsconfig.json',
      '.env',
      '.env.local',
      path.join('prisma', 'schema.prisma'),
    ]

    const files = candidates.filter((p) => fs.existsSync(p))

    files.forEach((file) => {
      try {
        fs.watch(file, { persistent: true }, () => {
          console.log(`📝 File changed: ${path.basename(file)}`)
          console.log('🔄 Restarting server...')
          this.kill()
          setTimeout(() => this.start(), 2_000)
        })
      } catch (e) {
        console.warn(`⚠️ Could not watch ${file}:`, e.message)
      }
    })
  }

  monitorMemory() {
    setInterval(() => {
      const used = process.memoryUsage()
      const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024)
      const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024)
      const rssMB = Math.round(used.rss / 1024 / 1024)

      if (heapUsedMB > 3000) {
        console.warn(`⚠️ High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (RSS: ${rssMB}MB)`) 
        console.log('🔄 Restarting server due to high memory usage...')
        this.handleRestart()
      }
    }, 30_000)
  }

  clearCache() {
    console.log('🧹 Clearing Next.js cache...')
    try {
      const cacheDir = path.join('.next', 'cache')
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true })
      }
      console.log('✅ Cache cleared')
    } catch (error) {
      console.error('❌ Failed to clear cache:', error.message)
      try {
        execSync('rm -rf .next/cache', { stdio: 'inherit' })
      } catch {}
    }
  }

  init() {
    this.clearCache()
    this.start()
    this.watchForChanges()
    this.monitorMemory()

    const shutdown = () => {
      console.log('\n👋 Shutting down gracefully...')
      this.kill()
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  }
}

const manager = new DevServerManager()
manager.init()
