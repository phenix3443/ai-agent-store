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
