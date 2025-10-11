import { setupServiceRequests } from '../helpers/targetedMocks'

export default function autoSetupServiceRequests(overrides: { requests?: any[] } = {}) {
  const data = setupServiceRequests(overrides)
  beforeEach(() => {
    setupServiceRequests(overrides)
  })
  return data
}
