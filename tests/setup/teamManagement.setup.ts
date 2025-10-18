import { setupTeamManagementMocks } from '../helpers/targetedMocks'
import { beforeEach } from 'vitest'

// Optional helper for tests to import and run setup
export function setupTeamManagement(overrides: { members?: any[] } = {}) {
  return setupTeamManagementMocks(overrides)
}

// Automatically apply when imported by a test file
export default function autoSetupTeamManagement(overrides: { members?: any[] } = {}) {
  const data = setupTeamManagement(overrides)
  beforeEach(() => {
    // Ensure mocks are reset then reapplied so each test is isolated
    setupTeamManagementMocks(overrides)
  })
  return data
}
