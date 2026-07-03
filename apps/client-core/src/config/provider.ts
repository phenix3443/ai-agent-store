import { readFile } from 'fs/promises'
import { join } from 'path'

export type ProviderAuthType = 'bearer' | 'anthropic' | { header: string }

export interface ProviderConnection {
  apiKey?: string
  baseUrl?: string
  authType?: ProviderAuthType
  modelMapping?: Record<string, string>
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function readAuthType(value: unknown): ProviderAuthType | undefined {
  if (value === 'bearer' || value === 'anthropic') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const header = readString((value as Record<string, unknown>)['header'])
    if (header) return { header }
  }
  return undefined
}

function readModelMapping(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) return undefined
  if (entries.some(([, v]) => typeof v !== 'string')) return undefined
  return Object.fromEntries(entries) as Record<string, string>
}

export async function readProviderConnection(itemDir: string): Promise<ProviderConnection> {
  try {
    const raw = JSON.parse(await readFile(join(itemDir, 'config.json'), 'utf-8')) as Record<string, unknown>
    return {
      apiKey: readString(raw['apiKey']) ?? readString(raw['token']),
      baseUrl:
        readString(raw['baseUrl']) ??
        readString(raw['apiUrl']) ??
        readString(raw['endpoint']) ??
        'https://api.openai.com/v1',
      authType: readAuthType(raw['authType']),
      modelMapping: readModelMapping(raw['modelMapping']),
    }
  } catch {
    return {}
  }
}
