import { setupServicesMocks } from '../helpers/targetedMocks'
import { beforeEach } from 'vitest'

export function setupServices(overrides: { services?: any[] } = {}) {
  return setupServicesMocks(overrides)
}

export default function autoSetupServices(overrides: { services?: any[] } = {}) {
  const data = setupServices(overrides)
  beforeEach(() => {
    setupServicesMocks(overrides)
  })
  return data
}
