import type { Item } from '@aas/types'
import Link from 'next/link'
import { Badge } from './Badge'

interface ItemCardProps {
  item: Item
}

export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link
      href={`/store/${item.category}/${item.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-ray-border bg-ray-surface-2 p-4 transition-colors hover:border-ray-border-hover hover:bg-ray-surface-3"
    >
      {/* Header: icon + name + badges */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ray-border bg-ray-surface-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.icon}
            alt={item.name}
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-ray-fg">
            {item.name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant={item.publisher.tier}>{item.publisher.tier}</Badge>
            <Badge variant={item.category}>{item.category}</Badge>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-xs text-ray-fg-secondary">
        {item.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-ray-fg-muted">
        <span>{item.compatibleWith.join(' · ')}</span>
        <span>{formatDownloads(item.downloads)} installs</span>
      </div>
    </Link>
  )
}
