export function isUnifiedSettingsEnabled(): boolean {
  try {
    // NEXT_PUBLIC variable available on client and server
    return (process.env.NEXT_PUBLIC_FEATURE_UNIFIED_SETTINGS || 'true').toString() === 'true'
  } catch (e) {
    return true
  }
}

const featureFlags = { isUnifiedSettingsEnabled }
export default featureFlags
