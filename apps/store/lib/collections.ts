import type { Item } from '@as/types'
import { getItems } from './catalog'

export interface Collection {
  slug: string
  title: string
  description: string
  match: (item: Item) => boolean
}

// Editorial groupings that give the catalog a spine. Hand-curated matchers.
export const COLLECTIONS: Collection[] = [
  {
    slug: 'verified',
    title: '已验证精选',
    description: '来自官方与已验证发布者的包，质量更有保障。',
    match: (it) => it.publisher.tier !== 'community',
  },
  {
    slug: 'anthropic',
    title: 'Anthropic 官方技能',
    description: 'Anthropic 出品的官方 skill。',
    match: (it) => it.publisher.slug === 'anthropics',
  },
  {
    slug: 'superpowers',
    title: 'Superpowers 工作流',
    description: 'obra/superpowers 的高效编码工作流技能。',
    match: (it) => it.publisher.slug === 'obra',
  },
  {
    slug: 'mcp',
    title: 'MCP 服务器',
    description: '为 agent 接入外部能力的 MCP 服务器。',
    match: (it) => it.category === 'mcp',
  },
]

export async function getCollections(): Promise<{ collection: Collection; items: Item[] }[]> {
  const all = await getItems({})
  return COLLECTIONS.map((collection) => ({ collection, items: all.filter(collection.match) })).filter((x) => x.items.length > 0)
}
