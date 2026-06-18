import { notFound } from 'next/navigation'
import { getPublisherBySlug, getPublisherItems } from '@/lib/queries/publishers'
import { ItemCard } from '@/components/ItemCard'
import { Badge } from '@/components/Badge'

interface PublisherPageProps {
  params: { name: string }
}

export default async function PublisherPage({ params }: PublisherPageProps) {
  const [publisherResult, itemsResult] = await Promise.all([
    getPublisherBySlug(params.name),
    getPublisherItems(params.name),
  ])

  if (publisherResult.error || !publisherResult.data) notFound()

  const publisher = publisherResult.data
  const items = itemsResult.data

  return (
    <main className="py-8">
      {/* Publisher header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-ray-border bg-ray-surface-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publisher.avatarUrl}
            alt={publisher.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ray-fg">{publisher.name}</h1>
            <Badge variant={publisher.tier}>{publisher.tier}</Badge>
          </div>
          {publisher.bio && (
            <p className="mt-1 text-sm text-ray-fg-secondary">{publisher.bio}</p>
          )}
        </div>
      </div>

      {/* Items */}
      <h2 className="mb-4 text-lg font-medium text-ray-fg">
        {items.length} item{items.length !== 1 ? 's' : ''}
      </h2>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-ray-border bg-ray-surface-1">
          <p className="text-ray-fg-muted">No published items yet.</p>
        </div>
      )}
    </main>
  )
}
