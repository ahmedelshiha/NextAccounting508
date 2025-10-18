import { setupServiceRequestsMocks } from '../helpers/targetedMocks'
import { beforeEach } from 'vitest'

export default function autoSetupServiceRequests(overrides: { requests?: any[] } = {}) {
  const data = setupServiceRequestsMocks(overrides)
  beforeEach(() => {
    setupServiceRequestsMocks(overrides)
  })
  return data
}
