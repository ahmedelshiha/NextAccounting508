const { execSync } = require('child_process')
const path = require('path')

module.exports = {
  onPostBuild: async ({ utils, constants }) => {
    // Only run when explicitly enabled
    const runE2E = process.env.RUN_E2E === 'true'
    if (!runE2E) {
      utils.status.show({ summary: 'E2E runner skipped (RUN_E2E != true)' })
      return
    }

    const repoRoot = constants.PUBLISH_DIR ? path.resolve(constants.PUBLISH_DIR, '..') : process.cwd()
    const scriptPath = path.join(repoRoot, 'e2e', 'run-e2e.sh')

    try {
      utils.status.show({ summary: 'Running E2E tests (ephemeral) via e2e/run-e2e.sh' })
      // Ensure script is executable
      execSync(`sh ${scriptPath}`, { stdio: 'inherit', cwd: repoRoot, env: process.env })
      utils.status.show({ summary: 'E2E tests completed successfully' })
    } catch (err) {
      utils.build.failBuild('E2E tests failed', { error: err })
    }
  }
}
