import { AgentPackageEngine } from './agent-package-engine'
import { getIsolatedFixturePathsFromEnv } from './fixture-env'

const [, , providerPackageDir, skillPackageDir] = process.argv

if (!providerPackageDir || !skillPackageDir) {
  throw new Error('Usage: bun run-agent-package-fixture.ts <provider-package-dir> <skill-package-dir>')
}

const apiKey = process.env['YLS_ME_API_KEY'] ?? 'test-yls-key'
const baseUrl = process.env['YLS_ME_BASE_URL'] ?? 'https://code.ylsagi.com/codex'

const paths = getIsolatedFixturePathsFromEnv()
const engine = new AgentPackageEngine(paths)

await engine.installFromPath(providerPackageDir)
await engine.setPackageConfig('local.yls-me-provider', {
  'yls-me': {
    apiKey,
    baseUrl,
  },
})
await engine.enablePackage('local.yls-me-provider', 'codex')
await engine.enablePackage('local.yls-me-provider', 'claude')

await engine.installFromPath(skillPackageDir)
await engine.enablePackage('local.frontend-design-skill', 'codex')
await engine.enablePackage('local.frontend-design-skill', 'claude')

console.log(
  JSON.stringify(
    {
      providerPackageId: 'local.yls-me-provider',
      skillPackageId: 'local.frontend-design-skill',
      codexConfigDir: paths.codexConfigDir,
      claudeConfigDir: paths.claudeConfigDir,
      aasHome: paths.aasHome,
    },
    null,
    2
  )
)
