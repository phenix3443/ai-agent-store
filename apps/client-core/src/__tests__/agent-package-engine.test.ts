import { test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm, mkdir, writeFile, readFile, cp } from 'fs/promises'
import { join } from 'path'
import { AgentPackageEngine } from '../agent-package-engine'

let workspaceDir: string
let packagesDir: string
let aasHome: string
let claudeDir: string
let codexDir: string

beforeEach(async () => {
  workspaceDir = await mkdtemp('/tmp/agent-package-workspace-')
  packagesDir = join(workspaceDir, 'fixtures')
  aasHome = await mkdtemp('/tmp/agent-package-home-')
  claudeDir = await mkdtemp('/tmp/agent-package-claude-')
  codexDir = await mkdtemp('/tmp/agent-package-codex-')
  await mkdir(packagesDir, { recursive: true })
})

afterEach(async () => {
  await rm(workspaceDir, { recursive: true, force: true })
  await rm(aasHome, { recursive: true, force: true })
  await rm(claudeDir, { recursive: true, force: true })
  await rm(codexDir, { recursive: true, force: true })
})

async function createProviderPackage(): Promise<string> {
  const dir = join(packagesDir, 'yls-me-provider')
  await mkdir(dir, { recursive: true })
  await writeFile(
    join(dir, 'agent-package.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        name: 'yls-me-provider',
        displayName: 'yls-me Provider',
        version: '1.0.0',
        description: 'Provider package for yls-me',
        publisher: { slug: 'local', name: 'Local' },
        categories: ['provider'],
        keywords: ['provider', 'yls-me'],
        components: [
          {
            id: 'yls-me',
            type: 'provider',
            version: '1.0.0',
            configSchema: {
              type: 'object',
              required: ['apiKey', 'baseUrl'],
              properties: {
                apiKey: { type: 'string', 'x-agent-secret': true },
                baseUrl: { type: 'string', default: 'https://code.ylsagi.com/codex' },
              },
            },
            models: ['gpt-5.4'],
            provider: {
              baseUrlKey: 'baseUrl',
            },
            targets: {
              claude: true,
              codex: true,
            },
          },
        ],
      },
      null,
      2
    )
  )
  return dir
}

async function createSkillPackage(): Promise<string> {
  const dir = join(packagesDir, 'frontend-design-skill')
  await mkdir(dir, { recursive: true })
  await writeFile(
    join(dir, 'agent-package.json'),
    JSON.stringify(
      {
        schemaVersion: 2,
        name: 'frontend-design-skill',
        displayName: 'Frontend Design Skill',
        version: '1.0.0',
        description: 'Local test package for frontend-design skill',
        publisher: { slug: 'local', name: 'Local' },
        categories: ['skill'],
        keywords: ['skill', 'frontend-design'],
        components: [
          {
            id: 'frontend-design',
            type: 'skill',
            version: '1.0.0',
            source: {
              repo: 'local/frontend-design',
              ref: 'main',
              path: 'skills/frontend-design/SKILL.md',
              format: 'markdown',
            },
            targets: {
              claude: true,
              codex: true,
            },
          },
        ],
      },
      null,
      2
    )
  )

  const sourceDir = join(dir, 'sources', 'local', 'frontend-design', 'skills', 'frontend-design')
  await mkdir(sourceDir, { recursive: true })
  await cp('/Users/liushangliang/.agents/skills/frontend-design/SKILL.md', join(sourceDir, 'SKILL.md'))
  return dir
}

test('installs local provider package, configures it, and syncs to codex and claude', async () => {
  const packageDir = await createProviderPackage()
  const engine = new AgentPackageEngine({
    aasHome,
    claudeConfigDir: claudeDir,
    codexConfigDir: codexDir,
  })

  const installed = await engine.installFromPath(packageDir)
  expect(installed.packageId).toBe('local.yls-me-provider')

  await engine.setPackageConfig('local.yls-me-provider', {
    'yls-me': {
      apiKey: 'yls-key',
      baseUrl: 'https://code.ylsagi.com/codex',
    },
  })
  await engine.enablePackage('local.yls-me-provider', 'codex')
  await engine.enablePackage('local.yls-me-provider', 'claude')

  const codexConfig = await readFile(join(codexDir, 'config.toml'), 'utf-8')
  expect(codexConfig).toContain('model = "gpt-5.4"')
  expect(codexConfig).toContain('model_provider = "local.yls-me-provider#yls-me"')
  expect(codexConfig).toContain('base_url = "https://code.ylsagi.com/codex"')
  const codexAuth = JSON.parse(await readFile(join(codexDir, 'auth.json'), 'utf-8'))
  expect(codexAuth.OPENAI_API_KEY).toBe('yls-key')

  const claudeSettings = JSON.parse(await readFile(join(claudeDir, 'settings.json'), 'utf-8'))
  expect(claudeSettings.env.ANTHROPIC_AUTH_TOKEN).toBe('yls-key')
  expect(claudeSettings.env.ANTHROPIC_BASE_URL).toBe('https://code.ylsagi.com/codex')
})

test('enabling package provider preserves existing codex config and auth entries', async () => {
  const packageDir = await createProviderPackage()
  const engine = new AgentPackageEngine({
    aasHome,
    claudeConfigDir: claudeDir,
    codexConfigDir: codexDir,
  })

  await writeFile(
    join(codexDir, 'config.toml'),
    'model = "existing-model"\n[sandbox_workspace_write]\nnetwork_access = true\n'
  )
  await writeFile(join(codexDir, 'auth.json'), JSON.stringify({ EXISTING_KEY: 'keep-me' }))

  await engine.installFromPath(packageDir)
  await engine.setPackageConfig('local.yls-me-provider', {
    'yls-me': {
      apiKey: 'yls-key',
      baseUrl: 'https://code.ylsagi.com/codex',
    },
  })
  await engine.enablePackage('local.yls-me-provider', 'codex')

  const codexConfig = await readFile(join(codexDir, 'config.toml'), 'utf-8')
  expect(codexConfig).toContain('model = "gpt-5.4"')
  expect(codexConfig).toContain('[sandbox_workspace_write]')
  expect(codexConfig).toContain('network_access = true')
  expect(codexConfig).toContain('model_provider = "local.yls-me-provider#yls-me"')

  const codexAuth = JSON.parse(await readFile(join(codexDir, 'auth.json'), 'utf-8'))
  expect(codexAuth.EXISTING_KEY).toBe('keep-me')
  expect(codexAuth.OPENAI_API_KEY).toBe('yls-key')
})

test('installs local skill package and syncs the skill file to codex and claude', async () => {
  const packageDir = await createSkillPackage()
  const engine = new AgentPackageEngine({
    aasHome,
    claudeConfigDir: claudeDir,
    codexConfigDir: codexDir,
  })

  await engine.installFromPath(packageDir)
  await engine.enablePackage('local.frontend-design-skill', 'codex')
  await engine.enablePackage('local.frontend-design-skill', 'claude')

  const codexSkill = await readFile(
    join(codexDir, 'skills', 'local.frontend-design-skill#frontend-design.md'),
    'utf-8'
  )
  const claudeSkill = await readFile(
    join(claudeDir, 'skills', 'local.frontend-design-skill#frontend-design.md'),
    'utf-8'
  )

  expect(codexSkill).toContain('name: frontend-design')
  expect(claudeSkill).toContain('name: frontend-design')
})
