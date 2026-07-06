'use client'

import type { Item } from '@as/types'
import Link from 'next/link'
import { Check, CheckCircle2, Heart } from 'lucide-react'
import { CATEGORY_META, CategoryGlyph, formatDownloads } from '@/lib/item-meta'
import { useClientState } from './ClientStateProvider'

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  const { favorites, toggleFavorite, installed, toggleInstalled } = useClientState()
  const isFavorite = !!favorites[item.id]
  const isInstalled = !!installed[item.id]
  const cat = CATEGORY_META[item.category]
  const tier = item.publisher.tier

  return (
    <Link
      href={`/store/${item.category}/${item.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-store-border bg-store-panel p-4 transition-colors hover:border-store-border-strong"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[20px]"
          style={{ background: cat.soft, color: cat.color }}
        >
          <CategoryGlyph category={item.category} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-mono text-sm font-bold text-store-text">{item.name}</h3>
            {(tier === 'official' || tier === 'verified') && (
              <CheckCircle2
                size={13}
                className={`shrink-0 ${tier === 'official' ? 'text-store-amber' : 'text-[#58a6f0]'}`}
              />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-store-text-3">{item.publisher.name}</p>
        </div>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: cat.soft, color: cat.color }}
        >
          {cat.label}
        </span>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-store-text-2">{item.description}</p>

      <div className="flex items-center gap-3 text-xs">
        <span className="font-mono text-store-text-3">↓ {formatDownloads(item.downloads)}</span>
        {item.rating > 0 && <span className="font-mono text-store-star">★ {item.rating.toFixed(1)}</span>}
        <span className="flex-1" />
        <button
          type="button"
          aria-label={isFavorite ? '取消收藏' : '收藏'}
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(item.id)
          }}
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-store-code-bg"
        >
          <Heart size={15} className={isFavorite ? 'fill-store-red text-store-red' : 'text-store-text-3'} />
        </button>
        {isInstalled ? (
          <button
            type="button"
            aria-label="已安装"
            onClick={(e) => {
              e.preventDefault()
              toggleInstalled(item.id)
            }}
            className="flex items-center gap-1 text-xs font-semibold text-store-green"
          >
            <Check size={13} />
            已装
          </button>
        ) : (
          <button
            type="button"
            aria-label="安装"
            onClick={(e) => {
              e.preventDefault()
              toggleInstalled(item.id)
            }}
            className="rounded-md border border-store-border-strong bg-store-panel-2 px-3 py-1 text-xs font-semibold text-store-text hover:border-store-accent hover:text-store-accent"
          >
            安装
          </button>
        )}
      </div>
    </Link>
  )
}
