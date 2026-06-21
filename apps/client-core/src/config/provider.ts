import { readFile } from 'fs/promises'
import { join } from 'path'

export interface ProviderConnection {
  apiKey?: string
  baseUrl?: string
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
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
    }
  } catch {
    return {}
  }
}
