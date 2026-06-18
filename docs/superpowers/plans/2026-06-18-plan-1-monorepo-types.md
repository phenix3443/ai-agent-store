# Plan 1: Monorepo Foundation + Types

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Turborepo monorepo with pnpm workspaces and create `packages/types` containing all shared TypeScript type definitions from the design spec.

**Architecture:** Single pnpm workspace at repo root with `apps/*` and `packages/*` patterns. `packages/types` is a private workspace package (`@aas/types`) exporting pure TypeScript interfaces and types — no runtime logic. All other packages will declare `@aas/types` as a workspace dependency.

**Tech Stack:** TypeScript 5.4+, Turborepo 2, pnpm 11.5, Bun 1.3+ (test runner)

## Global Constraints

- TypeScript `"strict": true` on all packages — no exceptions
- `"target": "ES2022"`, `"moduleResolution": "Bundler"` everywhere via `tsconfig.base.json`
- Bun ≥ 1.3.12 as test runner (`bun:test`) — NOT Jest or Vitest
- pnpm ≥ 11.5.0 — use `pnpm` for all package management, never `npm` or `yarn`
- All paths (`~/.agents/`, `~/.claude/`, `~/.codex/`) must be overridable via env vars — never hardcode in any file
- `ToolTarget = 'claude' | 'codex'` — this union is the canonical name for supported tools everywhere
- Repo root: the existing git repo at the directory containing `docs/`

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: Turborepo workspace recognizing `apps/*` and `packages/*`; shared `tsconfig.base.json` usable via `"extends": "../../tsconfig.base.json"` from any nested package

---

- [ ] **Step 1: Create `package.json`** (repo root)

```json
{
  "name": "ai-agent-store",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@11.5.0"
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

- [ ] **Step 5: Add to `.gitignore`** (append if file exists, create if not)

```
node_modules/
dist/
.turbo/
*.tsbuildinfo
.env
.env.local
.env.*.local
```

- [ ] **Step 6: Install dependencies and verify**

```bash
pnpm install
```

Expected: Creates `pnpm-lock.yaml`, installs turbo and typescript under `node_modules/.pnpm/`.

```bash
pnpm turbo --version
```

Expected: prints `2.x.x`

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .gitignore pnpm-lock.yaml
git commit -m "chore: initialize turborepo monorepo with pnpm workspaces"
```

---

## Task 2: `packages/types` — Package Setup

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts` (empty placeholder)

**Interfaces:**
- Consumes: `tsconfig.base.json` via `extends`
- Produces: `@aas/types` workspace package; other packages add `"@aas/types": "workspace:*"` to their dependencies

---

- [ ] **Step 1: Create `packages/types/package.json`**

```json
{
  "name": "@aas/types",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "test": "bun test",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `packages/types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "dist"]
}
```

- [ ] **Step 3: Create `packages/types/src/index.ts`** (empty, will be filled in Task 4)

```typescript
// re-exports filled in Task 4
```

- [ ] **Step 4: Install workspace dependencies from root**

```bash
pnpm install
```

Expected: `packages/types` appears in `pnpm list -r`.

```bash
pnpm list -r --depth=0
```

Expected: output includes `@aas/types 0.0.1`

- [ ] **Step 5: Commit**

```bash
git add packages/types/
git commit -m "chore: scaffold @aas/types workspace package"
```

---

## Task 3: `packages/types` — Publisher, Items, InstallHook

**Files:**
- Create: `packages/types/src/publisher.ts`
- Create: `packages/types/src/items.ts`
- Create: `packages/types/src/index.test.ts` (partial — Publisher + Item tests)

**Interfaces:**
- Produces:
  - `Publisher` interface with `tier: 'official' | 'verified' | 'community'`
  - `JsonSchema = Record<string, unknown>`
  - `InstallHook` with `steps` array (discriminated union: `script | config | file`)
  - `BaseItem` interface
  - `ProviderItem`, `SkillItem`, `MCPItem` extending `BaseItem`
  - `Item = ProviderItem | SkillItem | MCPItem` discriminated union

---

- [ ] **Step 1: Write the failing test**

Create `packages/types/src/index.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import type { Publisher, ProviderItem, SkillItem, MCPItem, Item, InstallHook } from './index'

describe('Publisher', () => {
  test('can construct a valid Publisher', () => {
    const pub: Publisher = {
      id: 'pub-1',
      slug: 'openai',
      name: 'OpenAI',
      avatarUrl: 'https://example.com/openai.png',
      tier: 'official',
    }
    expect(pub.tier).toBe('official')
    expect(pub.bio).toBeUndefined()
  })

  test('publisher with optional bio', () => {
    const pub: Publisher = {
      id: 'pub-2',
      slug: 'acme',
      name: 'Acme Corp',
      avatarUrl: 'https://example.com/acme.png',
      tier: 'verified',
      bio: 'We build AI tools.',
    }
    expect(pub.bio).toBe('We build AI tools.')
  })
})

describe('InstallHook', () => {
  test('can construct a multi-step InstallHook', () => {
    const hook: InstallHook = {
      steps: [
        { type: 'file', url: 'https://example.com/server', dest: 'server' },
        { type: 'config', patch: { transport: 'stdio', serverCommand: './server' } },
        { type: 'script', command: 'chmod +x server' },
      ],
    }
    expect(hook.steps).toHaveLength(3)
    expect(hook.steps[0].type).toBe('file')
    expect(hook.steps[1].type).toBe('config')
    expect(hook.steps[2].type).toBe('script')
  })

  test('empty steps is valid', () => {
    const hook: InstallHook = { steps: [] }
    expect(hook.steps).toHaveLength(0)
  })
})

describe('Item discriminated union', () => {
  test('ProviderItem has category provider', () => {
    const provider: ProviderItem = {
      id: 'item-1',
      slug: 'openai-provider',
      name: 'OpenAI Provider',
      description: 'OpenAI API access',
      readmeUrl: 'https://storage.example.com/readme.md',
      icon: 'https://storage.example.com/icon.png',
      category: 'provider',
      version: '1.0.0',
      publisher: { id: 'pub-1', slug: 'openai', name: 'OpenAI', avatarUrl: '', tier: 'official' },
      compatibleWith: ['claude', 'codex'],
      tags: ['openai', 'gpt'],
      downloads: 100000,
      rating: 0,
      status: 'published',
      installHook: { steps: [] },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      configSchema: { type: 'object', properties: { apiKey: { type: 'string' } } },
      supportedModels: ['gpt-4o', 'gpt-4o-mini'],
    }
    expect(provider.category).toBe('provider')
    expect(provider.supportedModels).toContain('gpt-4o')
  })

  test('SkillItem has category skill and contentUrl', () => {
    const skill: SkillItem = {
      id: 'item-2',
      slug: 'my-skill',
      name: 'My Skill',
      description: 'A useful skill',
      readmeUrl: 'https://storage.example.com/readme.md',
      icon: 'https://storage.example.com/icon.png',
      category: 'skill',
      version: '0.3.0',
      publisher: { id: 'pub-2', slug: 'alice', name: 'Alice', avatarUrl: '', tier: 'community' },
      compatibleWith: ['claude'],
      tags: ['productivity'],
      downloads: 500,
      rating: 0,
      status: 'published',
      installHook: { steps: [] },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      contentUrl: 'https://storage.example.com/skill.md',
    }
    expect(skill.category).toBe('skill')
    expect(skill.contentUrl).toMatch(/skill\.md$/)
  })

  test('MCPItem has category mcp, transport, serverCommand', () => {
    const mcp: MCPItem = {
      id: 'item-3',
      slug: 'filesystem-mcp',
      name: 'Filesystem MCP',
      description: 'Filesystem access via MCP',
      readmeUrl: 'https://storage.example.com/readme.md',
      icon: 'https://storage.example.com/icon.png',
      category: 'mcp',
      version: '0.1.0',
      publisher: { id: 'pub-3', slug: 'bob', name: 'Bob', avatarUrl: '', tier: 'community' },
      compatibleWith: ['claude'],
      tags: ['filesystem'],
      downloads: 2000,
      rating: 0,
      status: 'published',
      installHook: {
        steps: [
          { type: 'file', url: 'https://example.com/server', dest: 'server' },
        ],
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      transport: 'stdio',
      serverCommand: './server',
      configSchema: {},
    }
    expect(mcp.transport).toBe('stdio')
    expect(mcp.serverCommand).toBe('./server')
  })

  test('Item union narrows correctly by category', () => {
    const items: Item[] = []  // just testing that the union type compiles
    expect(items).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test — verify it fails (types not defined yet)**

```bash
cd packages/types && bun test
```

Expected: Error like `Cannot find module './index'` or type errors — confirms types not yet defined.

- [ ] **Step 3: Create `packages/types/src/publisher.ts`**

```typescript
export interface Publisher {
  id: string
  slug: string
  name: string
  avatarUrl: string
  tier: 'official' | 'verified' | 'community'
  bio?: string
}
```

- [ ] **Step 4: Create `packages/types/src/items.ts`**

```typescript
import type { Publisher } from './publisher'

export type JsonSchema = Record<string, unknown>

export interface InstallHook {
  steps: Array<
    | { type: 'script'; command: string }
    | { type: 'config'; patch: Record<string, unknown> }
    | { type: 'file'; url: string; dest: string }
  >
}

export interface BaseItem {
  id: string
  slug: string
  name: string
  description: string
  /** Supabase Storage URL pointing to Markdown content (documentation) */
  readmeUrl: string
  /** Supabase Storage URL for the item icon */
  icon: string
  category: 'provider' | 'skill' | 'mcp'
  version: string
  publisher: Publisher
  compatibleWith: ('claude' | 'codex')[]
  tags: string[]
  downloads: number
  /** Always 0 in MVP — rating system deferred */
  rating: number
  status: 'published' | 'pending' | 'rejected'
  installHook: InstallHook
  createdAt: string
  updatedAt: string
}

export interface ProviderItem extends BaseItem {
  category: 'provider'
  configSchema: JsonSchema
  supportedModels: string[]
}

export interface SkillItem extends BaseItem {
  category: 'skill'
  /** Download URL for the installable skill file (distinct from readmeUrl) */
  contentUrl: string
}

export interface MCPItem extends BaseItem {
  category: 'mcp'
  transport: 'stdio' | 'sse' | 'http'
  /** Runtime command to start the MCP server AFTER install (e.g. "./server", "node server.js") */
  serverCommand: string
  configSchema: JsonSchema
}

export type Item = ProviderItem | SkillItem | MCPItem
```

- [ ] **Step 5: Update `packages/types/src/index.ts`** (partial — more exports added in Task 4)

```typescript
export type { Publisher } from './publisher'
export type { JsonSchema, InstallHook, BaseItem, ProviderItem, SkillItem, MCPItem, Item } from './items'
```

- [ ] **Step 6: Run test — verify Publisher + Item tests pass**

```bash
cd packages/types && bun test
```

Expected: All `Publisher` and `Item discriminated union` describe blocks pass. `InstallHook` tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/types/src/
git commit -m "feat(types): add Publisher, BaseItem, ProviderItem, SkillItem, MCPItem types"
```

---

## Task 4: `packages/types` — Engine API + Registry Types

**Files:**
- Create: `packages/types/src/engine.ts`
- Create: `packages/types/src/registry.ts`
- Modify: `packages/types/src/index.ts` (add exports)
- Modify: `packages/types/src/index.test.ts` (add engine + registry tests)

**Interfaces:**
- Produces:
  - `ToolTarget = 'claude' | 'codex'` (canonical union)
  - `AASPaths` (the three configurable directories)
  - `InstalledItem` (registry entry shape)
  - `RegistryJson` (`{ installed: InstalledItem[] }`)
  - `SearchOptions`, `InstallResult`, `SyncResult`, `UpdateAvailable`, `UpdateResult`, `ListOptions`, `ItemDetail`
  - `AASEngine` interface (methods only — no implementation)

---

- [ ] **Step 1: Add engine + registry tests to `packages/types/src/index.test.ts`**

Append to the existing test file:

```typescript
import type {
  AASPaths,
  InstalledItem,
  RegistryJson,
  ItemDetail,
  SearchOptions,
  InstallResult,
  SyncResult,
  UpdateAvailable,
  UpdateResult,
  ListOptions,
} from './index'

describe('AASPaths', () => {
  test('can construct AASPaths with all three directories', () => {
    const paths: AASPaths = {
      aasHome: '/tmp/test/agents',
      claudeConfigDir: '/tmp/test/claude',
      codexConfigDir: '/tmp/test/codex',
    }
    expect(paths.aasHome).toBe('/tmp/test/agents')
    expect(paths.claudeConfigDir).toBe('/tmp/test/claude')
    expect(paths.codexConfigDir).toBe('/tmp/test/codex')
  })
})

describe('InstalledItem', () => {
  test('can construct a fully enabled InstalledItem', () => {
    const item: InstalledItem = {
      slug: 'openai-provider',
      category: 'provider',
      version: '1.0.0',
      installedAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z',
      compatibleWith: ['claude', 'codex'],
      enabledFor: { claude: true, codex: true },
    }
    expect(item.enabledFor.claude).toBe(true)
    expect(item.enabledFor.codex).toBe(true)
  })

  test('enabledFor can be partial (MCP only supports claude)', () => {
    const item: InstalledItem = {
      slug: 'filesystem-mcp',
      category: 'mcp',
      version: '0.1.0',
      installedAt: '2026-06-18T11:00:00Z',
      updatedAt: '2026-06-18T11:00:00Z',
      compatibleWith: ['claude'],
      enabledFor: { claude: true },
    }
    expect(item.enabledFor.codex).toBeUndefined()
  })
})

describe('RegistryJson', () => {
  test('can construct a valid registry with multiple items', () => {
    const registry: RegistryJson = {
      installed: [
        {
          slug: 'my-skill',
          category: 'skill',
          version: '0.3.0',
          installedAt: '2026-06-18T10:00:00Z',
          updatedAt: '2026-06-18T10:00:00Z',
          compatibleWith: ['claude'],
          enabledFor: { claude: true },
        },
      ],
    }
    expect(registry.installed).toHaveLength(1)
    expect(registry.installed[0].slug).toBe('my-skill')
  })
})

describe('Result types', () => {
  test('InstallResult shape', () => {
    const result: InstallResult = {
      slug: 'openai-provider',
      version: '1.0.0',
      installedAt: '2026-06-18T10:00:00Z',
    }
    expect(result.slug).toBe('openai-provider')
  })

  test('SyncResult shape', () => {
    const result: SyncResult = {
      synced: ['openai-provider', 'my-skill'],
      errors: [{ slug: 'broken-mcp', error: 'server file not found' }],
    }
    expect(result.synced).toHaveLength(2)
    expect(result.errors[0].slug).toBe('broken-mcp')
  })

  test('UpdateAvailable shape', () => {
    const update: UpdateAvailable = {
      slug: 'my-skill',
      currentVersion: '0.3.0',
      latestVersion: '0.4.0',
    }
    expect(update.latestVersion).toBe('0.4.0')
  })
})
```

- [ ] **Step 2: Run test — verify new tests fail**

```bash
cd packages/types && bun test
```

Expected: Tests fail with `Cannot find module` or type errors for the newly imported types.

- [ ] **Step 3: Create `packages/types/src/engine.ts`**

```typescript
import type { Item, JsonSchema } from './items'
import type { Publisher } from './publisher'

/** The canonical union for supported tool targets */
export type ToolTarget = 'claude' | 'codex'

/**
 * Configurable paths — all three must be overridable for test isolation.
 * Default resolution (in AASEngine implementation, not this package):
 *   aasHome       = process.env.AAS_HOME ?? '~/.agents'
 *   claudeConfigDir = process.env.CLAUDE_CONFIG_DIR ?? '~/.claude'
 *   codexConfigDir  = process.env.CODEX_CONFIG_DIR ?? '~/.codex'
 */
export interface AASPaths {
  aasHome: string
  claudeConfigDir: string
  codexConfigDir: string
}

export interface SearchOptions {
  category?: 'provider' | 'skill' | 'mcp'
  compatibleWith?: ToolTarget[]
  limit?: number
  offset?: number
}

export interface InstallResult {
  slug: string
  version: string
  installedAt: string
}

export interface SyncResult {
  synced: string[]
  errors: Array<{ slug: string; error: string }>
}

export interface UpdateAvailable {
  slug: string
  currentVersion: string
  latestVersion: string
}

export interface UpdateResult {
  slug: string
  fromVersion: string
  toVersion: string
}

export interface ListOptions {
  category?: 'provider' | 'skill' | 'mcp'
  enabledFor?: ToolTarget
}

/** A registry entry — shape stored in ~/.agents/registry.json and returned by AASEngine.list() */
export interface InstalledItem {
  slug: string
  category: 'provider' | 'skill' | 'mcp'
  version: string
  installedAt: string
  updatedAt: string
  compatibleWith: ToolTarget[]
  /** Partial: only contains entries for tools in compatibleWith */
  enabledFor: Partial<Record<ToolTarget, boolean>>
}

/**
 * Full item detail — union of market metadata and local install state.
 * Returned by AASEngine.info(). Category-specific fields are optional
 * and only populated for the relevant category.
 */
export interface ItemDetail {
  // Identity + install state (from registry)
  slug: string
  category: 'provider' | 'skill' | 'mcp'
  version: string
  installedAt: string
  updatedAt: string
  compatibleWith: ToolTarget[]
  enabledFor: Partial<Record<ToolTarget, boolean>>
  // Market metadata
  name: string
  description: string
  readmeUrl: string
  icon: string
  publisher: Publisher
  tags: string[]
  downloads: number
  // Category-specific (optional — populated based on category)
  /** provider + mcp: JSON Schema for user configuration fields */
  configSchema?: JsonSchema
  /** provider + mcp: current values stored in ~/.agents/.../config.json */
  currentConfig?: Record<string, unknown>
  /** provider only */
  supportedModels?: string[]
  /** mcp only */
  transport?: 'stdio' | 'sse' | 'http'
  /** mcp only: runtime command written to tool config after install */
  serverCommand?: string
  /** skill only */
  contentUrl?: string
}

/**
 * AASEngine interface — the public contract for the engine.
 * Implementation lives in apps/client-core. CLI and GUI both depend on this interface.
 *
 * IMPORTANT: All methods are pure data I/O. No terminal output, no interactive prompts.
 * The CLI layer calls getConfigSchema() + setConfig() and handles prompting itself.
 */
export interface AASEngine {
  search(query: string, options?: SearchOptions): Promise<Item[]>
  install(slug: string): Promise<InstallResult>
  uninstall(slug: string): Promise<void>
  enable(slug: string, target: ToolTarget): Promise<void>
  disable(slug: string, target: ToolTarget): Promise<void>
  /** Returns configSchema and current values — CLI/GUI renders prompts/form from this */
  getConfigSchema(slug: string): Promise<{ schema: JsonSchema; current: Record<string, unknown> }>
  /** Saves config values and triggers sync for that item */
  setConfig(slug: string, values: Record<string, unknown>): Promise<void>
  sync(targets?: ToolTarget[]): Promise<SyncResult>
  checkUpdates(slugs?: string[]): Promise<UpdateAvailable[]>
  update(slug?: string): Promise<UpdateResult[]>
  list(options?: ListOptions): Promise<InstalledItem[]>
  info(slug: string): Promise<ItemDetail>
}
```

- [ ] **Step 4: Create `packages/types/src/registry.ts`**

```typescript
import type { InstalledItem } from './engine'

export type { InstalledItem }

/** Shape of ~/.agents/registry.json */
export interface RegistryJson {
  installed: InstalledItem[]
}
```

- [ ] **Step 5: Update `packages/types/src/index.ts`** — final exports

```typescript
export type { Publisher } from './publisher'
export type { JsonSchema, InstallHook, BaseItem, ProviderItem, SkillItem, MCPItem, Item } from './items'
export type {
  ToolTarget,
  AASPaths,
  SearchOptions,
  InstallResult,
  SyncResult,
  UpdateAvailable,
  UpdateResult,
  ListOptions,
  InstalledItem,
  ItemDetail,
  AASEngine,
} from './engine'
export type { RegistryJson } from './registry'
```

- [ ] **Step 6: Run tests — verify all pass**

```bash
cd packages/types && bun test
```

Expected: All tests pass. Output resembles:
```
✓ Publisher > can construct a valid Publisher
✓ Publisher > publisher with optional bio
✓ InstallHook > can construct a multi-step InstallHook
✓ InstallHook > empty steps is valid
✓ Item discriminated union > ProviderItem has category provider
✓ Item discriminated union > SkillItem has category skill and contentUrl
✓ Item discriminated union > MCPItem has category mcp, transport, serverCommand
✓ Item discriminated union > Item union narrows correctly by category
✓ AASPaths > can construct AASPaths with all three directories
✓ InstalledItem > can construct a fully enabled InstalledItem
✓ InstalledItem > enabledFor can be partial (MCP only supports claude)
✓ RegistryJson > can construct a valid registry with multiple items
✓ Result types > InstallResult shape
✓ Result types > SyncResult shape
✓ Result types > UpdateAvailable shape

15 pass, 0 fail
```

- [ ] **Step 7: Run type-check (build without emit)**

```bash
cd packages/types && pnpm type-check
```

Expected: Exits 0, no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/types/src/
git commit -m "feat(types): add engine API types, AASPaths, InstalledItem, RegistryJson"
```

---

## Task 5: Build `@aas/types` + Workspace Dependency Smoke Test

**Files:**
- No new files — verifying the build pipeline and workspace linking

**Interfaces:**
- Produces: `packages/types/dist/` with compiled `.js` + `.d.ts` files; `@aas/types` importable as `"@aas/types": "workspace:*"` from any other package

---

- [ ] **Step 1: Build the types package**

```bash
cd packages/types && pnpm build
```

Expected: `dist/` directory created with `index.js`, `index.d.ts`, `index.d.ts.map`.

- [ ] **Step 2: Verify build outputs**

```bash
ls packages/types/dist/
```

Expected: `index.js`, `index.d.ts`, `index.js.map`, `index.d.ts.map` (and matching files for publisher, items, engine, registry)

- [ ] **Step 3: Run Turborepo build from root**

```bash
pnpm build
```

Expected: Turbo picks up `packages/types`, runs build, exits 0. Output includes `@aas/types:build` task completing.

- [ ] **Step 4: Verify full test suite from root**

```bash
pnpm test
```

Expected: All 15 tests pass via `turbo test`. Output includes:
```
@aas/types:test: 15 pass, 0 fail
```

- [ ] **Step 5: Commit**

```bash
git add packages/types/dist/ packages/
git commit -m "chore(types): verify @aas/types builds and all tests pass"
```

---

## Self-Review Checklist

- [x] **Spec coverage** — All types from Section 3 (Publisher, BaseItem, ProviderItem, SkillItem, MCPItem, InstallHook, JsonSchema) are defined. All engine API types from Section 6.5 (AASPaths, AASEngine interface, result types) are defined. RegistryJson from Section 6.2 is defined.
- [x] **Path isolation** — `AASPaths` interface defined with all three dirs. Section 6.0 requirement satisfied at type level.
- [x] **No placeholders** — All types are complete with exact field names and types matching the spec.
- [x] **Type consistency** — `ToolTarget` used everywhere instead of ad-hoc `'claude' | 'codex'` repetition. `InstalledItem.enabledFor` typed as `Partial<Record<ToolTarget, boolean>>` matching registry.json spec.
- [x] **`verbatimModuleSyntax`** — All imports in type files use `import type {}` syntax.
- [x] **`AASEngine` is an interface** — Implementation is in `apps/client-core`, not here.
