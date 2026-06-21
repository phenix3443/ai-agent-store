import { AgentPackageEngine } from '../apps/client-core/src/agent-package-engine'
import { getIsolatedFixturePathsFromEnv } from '../apps/client-core/src/fixture-env'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const [, , providerPackageDir, skillPackageDir] = process.argv
if (!providerPackageDir || !skillPackageDir) {
  throw new Error('Usage: bun run-agent-package-fixture.ts <provider-package-dir> <skill-package-dir>')
}

const apiKey = process.env['YLS_ME_API_KEY'] ?? 'test-yls-key'
const baseUrl = process.env['YLS_ME_BASE_URL'] ?? 'https://code.ylsagi.com/codex'
const codexRelayBaseUrl = process.env['CODEX_RELAY_BASE_URL']
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

if (codexRelayBaseUrl) {
  const configPath = join(paths.codexConfigDir, 'config.toml')
  const config = await readFile(configPath, 'utf-8')
  await writeFile(
    configPath,
    config.replace(/base_url = ".*"/, `base_url = "${codexRelayBaseUrl}"`)
  )
}

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
