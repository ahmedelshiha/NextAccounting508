/**
 * Debounce function to delay execution of handlers
 * Useful for search inputs, auto-save operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to limit execution frequency
 * Useful for scroll events, window resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Request deduplication utility
 * Prevents multiple simultaneous requests to the same endpoint
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  /**
   * Execute a fetch request with automatic deduplication
   * If a request to the same URL is already in progress, return the same promise
   */
  async deduplicate<T>(
    url: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url)!
    }

    const promise = fetchFn()
      .then(result => {
        this.pendingRequests.delete(url)
        return result
      })
      .catch(error => {
        this.pendingRequests.delete(url)
        throw error
      })

    this.pendingRequests.set(url, promise)
    return promise
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }

  /**
   * Clear all pending requests tracking (but doesn't cancel them)
   */
  clear(): void {
    this.pendingRequests.clear()
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator()

/**
 * Batch multiple updates into a single operation
 * Useful for reducing number of API calls when multiple changes happen in quick succession
 */
export class BatchedUpdater<T> {
  private pendingUpdates: T[] = []
  private timeout: NodeJS.Timeout | null = null
  private batchDelay: number
  private onBatch: (updates: T[]) => Promise<void>

  constructor(onBatch: (updates: T[]) => Promise<void>, batchDelay: number = 500) {
    this.onBatch = onBatch
    this.batchDelay = batchDelay
  }

  /**
   * Add an update to the batch
   */
  add(update: T): void {
    this.pendingUpdates.push(update)
    this.scheduleBatch()
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    this.timeout = setTimeout(() => {
      this.flush()
    }, this.batchDelay)
  }

  /**
   * Flush pending updates immediately
   */
  async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    if (this.pendingUpdates.length === 0) {
      return
    }

    const updates = this.pendingUpdates
    this.pendingUpdates = []

    try {
      await this.onBatch(updates)
    } catch (error) {
      // Log error but don't re-throw
      console.error('Batch update failed:', error)
    }
  }

  /**
   * Get pending updates count
   */
  getPendingCount(): number {
    return this.pendingUpdates.length
  }
}

/**
 * Utility to measure performance metrics
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private marks = new Map<string, number>()

  /**
   * Start measuring a metric
   */
  start(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * End measuring and record duration
   */
  end(name: string): number {
    const startTime = this.marks.get(name)
    if (!startTime) {
      console.warn(`Performance metric '${name}' not started`)
      return 0
    }

    const duration = performance.now() - startTime
    const list = this.metrics.get(name) ?? []
    list.push(duration)
    this.metrics.set(name, list)
    this.marks.delete(name)

    return duration
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name: string): number {
    const list = this.metrics.get(name)
    if (!list || list.length === 0) return 0
    return list.reduce((a, b) => a + b, 0) / list.length
  }

  /**
   * Get all metrics
   */
  getMetrics(): Record<string, { count: number; average: number; total: number }> {
    const result: Record<string, any> = {}

    for (const [name, durations] of this.metrics) {
      const total = durations.reduce((a, b) => a + b, 0)
      result[name] = {
        count: durations.length,
        average: total / durations.length,
        total,
      }
    }

    return result
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear()
    this.marks.clear()
  }

  /**
   * Log all metrics to console
   */
  log(): void {
    console.table(this.getMetrics())
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()
