import type { Item, Publisher } from '@aas/types'

export type Result<T> = { data: T; error: null } | { data: null; error: string }

export interface GetItemsParams {
  category?: 'provider' | 'skill' | 'mcp'
  q?: string
  limit?: number
  offset?: number
  sort?: 'downloads' | 'created'
}

export interface CreateItemBody {
  slug: string
  name: string
  description: string
  category: 'provider' | 'skill' | 'mcp'
  version: string
  readmeUrl: string
  icon: string
  compatibleWith: string[]
  tags: string[]
}

export interface PublisherWithItems {
  publisher: Publisher
  items: Item[]
}

export class AASClient {
  readonly baseUrl: string

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async getItems(params: GetItemsParams = {}): Promise<Result<Item[]>> {
    try {
      const url = new URL(`${this.baseUrl}/api/items`)
      if (params.category) url.searchParams.set('category', params.category)
      if (params.q) url.searchParams.set('q', params.q)
      if (params.limit != null) url.searchParams.set('limit', String(params.limit))
      if (params.offset != null) url.searchParams.set('offset', String(params.offset))
      if (params.sort) url.searchParams.set('sort', params.sort)

      const res = await fetch(url.toString())
      const json = await res.json() as { items?: Item[]; error?: string }

      if (!res.ok) return { data: null, error: json.error ?? `HTTP ${res.status}` }
      return { data: json.items ?? [], error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) }
    }
  }

  async getItemBySlug(slug: string): Promise<Result<Item>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/items/${encodeURIComponent(slug)}`)
      const json = await res.json() as { item?: Item; error?: string }

      if (!res.ok) return { data: null, error: json.error ?? `HTTP ${res.status}` }
      if (!json.item) return { data: null, error: 'No item in response' }
      return { data: json.item, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) }
    }
  }
}
