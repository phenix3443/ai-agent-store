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
