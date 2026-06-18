import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getItemBySlug } from '@/lib/queries/items'
import { Badge } from '@/components/Badge'
import { Readme } from '@/components/Readme'

interface ItemDetailPageProps {
  params: { category: string; slug: string }
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { data: item, error } = await getItemBySlug(params.slug)

  if (error || !item) notFound()
  if (item.category !== params.category) notFound()

  const installCmd = `aas install ${item.slug}`

  return (
    <main className="py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ray-border bg-ray-surface-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.icon} alt={item.name} className="h-12 w-12 object-contain" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-ray-fg">{item.name}</h1>
            <span className="text-ray-fg-muted">v{item.version}</span>
            <Badge variant={item.publisher.tier}>{item.publisher.tier}</Badge>
          </div>
          <p className="mt-1 text-ray-fg-secondary">{item.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-ray-border bg-ray-surface-1 px-2 py-0.5 text-xs text-ray-fg-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Readme */}
        <div className="min-w-0 rounded-xl border border-ray-border bg-ray-surface-1 p-6">
          <Suspense fallback={<p className="text-ray-fg-muted">Loading readme…</p>}>
            <Readme url={item.readmeUrl} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Install */}
          <div className="rounded-xl border border-ray-border bg-ray-surface-1 p-4">
            <p className="mb-2 text-sm font-medium text-ray-fg">Install</p>
            <code className="block rounded-lg border border-ray-border bg-ray-surface-0 px-3 py-2 font-mono text-xs text-ray-fg">
              {installCmd}
            </code>
          </div>

          {/* Info */}
          <div className="rounded-xl border border-ray-border bg-ray-surface-1 p-4 text-sm">
            <dl className="flex flex-col gap-2">
              <div className="flex justify-between">
                <dt className="text-ray-fg-muted">Publisher</dt>
                <dd className="text-ray-fg">{item.publisher.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ray-fg-muted">Compatible with</dt>
                <dd className="text-ray-fg">{item.compatibleWith.join(', ')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ray-fg-muted">Downloads</dt>
                <dd className="text-ray-fg">{item.downloads.toLocaleString()}</dd>
              </div>
              {item.category === 'provider' && (
                <div className="flex flex-col gap-1">
                  <dt className="text-ray-fg-muted">Models</dt>
                  <dd className="text-ray-fg">{item.supportedModels.join(' · ')}</dd>
                </div>
              )}
              {item.category === 'mcp' && (
                <div className="flex justify-between">
                  <dt className="text-ray-fg-muted">Transport</dt>
                  <dd className="text-ray-fg">{item.transport}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </main>
  )
}
