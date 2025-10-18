/**
 * Admin Dashboard Environment Detection
 * 
 * Detects and exposes environment information (production/staging/development)
 * with color coding and descriptions for the admin footer.
 * 
 * @module @/lib/admin/environment
 */

export type Environment = 'production' | 'staging' | 'development'
export type EnvironmentColor = 'blue' | 'purple' | 'orange'

/**
 * Detect the current environment based on multiple signals
 * 
 * Priority:
 * 1. NEXT_PUBLIC_ENVIRONMENT env var (explicit override)
 * 2. NODE_ENV (next build standard)
 * 3. Hostname detection (production/staging/development)
 * 4. Fallback to development
 * 
 * @returns 'production' | 'staging' | 'development'
 */
export function getEnvironment(): Environment {
  // 1. Check explicit environment override
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENVIRONMENT) {
    const env = process.env.NEXT_PUBLIC_ENVIRONMENT.toLowerCase()
    if (env === 'production' || env === 'staging' || env === 'development') {
      return env as Environment
    }
  }

  // 2. Check NODE_ENV
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    const nodeEnv = process.env.NODE_ENV.toLowerCase()
    if (nodeEnv === 'production') return 'production'
    if (nodeEnv === 'development') return 'development'
  }

  // 3. Check hostname (client-side)
  if (typeof window !== 'undefined' && window.location.hostname) {
    const hostname = window.location.hostname.toLowerCase()

    // Production patterns
    if (
      hostname.includes('prod') ||
      hostname.includes('nextaccounting.com') ||
      hostname === 'api.nextaccounting.com'
    ) {
      return 'production'
    }

    // Staging patterns
    if (hostname.includes('staging') || hostname.includes('stg')) {
      return 'staging'
    }

    // Development patterns
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0'
    ) {
      return 'development'
    }
  }

  // 4. Fallback
  return 'development'
}

/**
 * Get Tailwind color class for environment badge
 * 
 * @param environment Environment type
 * @returns Tailwind color: 'blue' | 'purple' | 'orange'
 */
export function getEnvironmentColor(
  environment: Environment = getEnvironment()
): EnvironmentColor {
  const colorMap: Record<Environment, EnvironmentColor> = {
    production: 'blue',
    staging: 'purple',
    development: 'orange',
  }
  return colorMap[environment]
}

/**
 * Get human-readable environment description for tooltips
 * 
 * @param environment Environment type
 * @returns Description string
 */
export function getEnvironmentDescription(
  environment: Environment = getEnvironment()
): string {
  const descriptions: Record<Environment, string> = {
    production: 'Production environment - live user data',
    staging: 'Staging environment - testing and pre-production',
    development: 'Development environment - local testing',
  }
  return descriptions[environment]
}

/**
 * Get environment label for UI display
 * 
 * @param environment Environment type
 * @returns Capitalized environment name
 */
export function getEnvironmentLabel(
  environment: Environment = getEnvironment()
): string {
  const labels: Record<Environment, string> = {
    production: 'Production',
    staging: 'Staging',
    development: 'Development',
  }
  return labels[environment]
}

/**
 * Check if running in production
 * 
 * @returns true if environment is 'production'
 */
export function isProduction(
  environment: Environment = getEnvironment()
): boolean {
  return environment === 'production'
}

/**
 * Check if running in staging
 * 
 * @returns true if environment is 'staging'
 */
export function isStaging(
  environment: Environment = getEnvironment()
): boolean {
  return environment === 'staging'
}

/**
 * Check if running in development
 * 
 * @returns true if environment is 'development'
 */
export function isDevelopment(
  environment: Environment = getEnvironment()
): boolean {
  return environment === 'development'
}

/**
 * Get appropriate banner message for environment
 * Used in debug scenarios or admin notifications
 * 
 * @param environment Environment type
 * @returns Environment-specific message
 */
export function getEnvironmentBannerMessage(
  environment: Environment = getEnvironment()
): string {
  const messages: Record<Environment, string> = {
    production: '⚠️ You are viewing production data',
    staging: '🔄 This is a staging environment - changes are temporary',
    development: '✅ Development environment - local testing',
  }
  return messages[environment]
}

/**
 * Get environment metrics or warnings for logging
 * Useful for error reporting and monitoring
 * 
 * @param environment Environment type
 * @returns Object with environment metadata
 */
export function getEnvironmentMetadata(
  environment: Environment = getEnvironment()
): {
  environment: Environment
  label: string
  color: EnvironmentColor
  description: string
  isProduction: boolean
  isStaging: boolean
  isDevelopment: boolean
} {
  return {
    environment,
    label: getEnvironmentLabel(environment),
    color: getEnvironmentColor(environment),
    description: getEnvironmentDescription(environment),
    isProduction: isProduction(environment),
    isStaging: isStaging(environment),
    isDevelopment: isDevelopment(environment),
  }
}

/**
 * Safe environment detection that handles server/client differences
 * Always returns a valid environment
 * 
 * @returns Environment string safe for use in both server and client
 */
export function getSafeEnvironment(): Environment {
  try {
    return getEnvironment()
  } catch {
    return 'development'
  }
}
