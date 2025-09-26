const { spawn, execSync } = require('child_process')
const chokidar = require('chokidar')
const path = require('path')

class DevServerManager {
  constructor() {
    this.server = null
    this.restartTimeout = null
    this.restartCount = 0
    this.maxRestarts = 5
    this.port = process.env.PORT || 3001
    this.host = '0.0.0.0'
  }

  resolveNextBin() {
    try {
      const pkgPath = require.resolve('next/package.json')
      const nextBin = path.join(path.dirname(pkgPath), 'dist', 'bin', 'next')
      return nextBin
    } catch (e) {
      return null
    }
  }

  start() {
    console.log(`🚀 Starting development server on http://${this.host}:${this.port}`)

    if (this.server) this.kill()

    const env = {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
      NEXT_TELEMETRY_DISABLED: '1',
    }

    const nextBin = this.resolveNextBin()
    if (!nextBin) {
      console.error('❌ Cannot resolve Next.js binary. Ensure dependencies are installed.')
      this.handleRestart()
      return
    }

    this.server = spawn(process.execPath, [nextBin, 'dev', '-p', String(this.port), '-H', this.host], {
      stdio: 'inherit',
      env,
    })

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
    }, 10000)
  }

  kill() {
    if (this.server && !this.server.killed) {
      console.log('🛑 Stopping server...')
      try { this.server.kill('SIGTERM') } catch {}
      setTimeout(() => {
        if (this.server && !this.server.killed) {
          try { this.server.kill('SIGKILL') } catch {}
        }
      }, 5000)
    }
  }

  handleRestart() {
    if (this.restartCount >= this.maxRestarts) {
      console.error('❌ Max restart attempts reached. Please fix the issues and restart manually.')
      process.exit(1)
    }
    this.restartCount++
    console.log(`🔄 Restarting server (attempt ${this.restartCount}/${this.maxRestarts})...`)
    if (this.restartTimeout) clearTimeout(this.restartTimeout)
    this.restartTimeout = setTimeout(() => this.start(), 3000)
  }

  watchForChanges() {
    const watcher = chokidar.watch([
      'next.config.js',
      'next.config.mjs',
      'package.json',
      'tsconfig.json',
      '.env',
      '.env.local',
      'prisma/schema.prisma',
    ], {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    })

    const restartDebounced = (() => {
      let t
      return (fp) => {
        if (t) clearTimeout(t)
        t = setTimeout(() => {
          console.log(`📝 File changed: ${path.basename(fp)}`)
          console.log('🔄 Restarting server...')
          this.kill()
          setTimeout(() => this.start(), 2000)
        }, 300)
      }
    })()

    watcher.on('change', restartDebounced)
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
    }, 30000)
  }

  clearCache() {
    console.log('🧹 Clearing Next.js cache...')
    try {
      execSync('rm -rf .next/cache', { stdio: 'inherit' })
    } catch (error) {
      console.error('❌ Failed to clear cache:', error.message)
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
