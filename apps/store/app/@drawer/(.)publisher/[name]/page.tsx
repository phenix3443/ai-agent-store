import { getPublisherWithItems } from '@/lib/catalog'
import { InterceptedPublisher } from '@/components/InterceptedPublisher'

interface InterceptedPublisherProps {
  params: Promise<{ name: string }>
}

export default async function InterceptedPublisherDrawer({ params }: InterceptedPublisherProps) {
  const { name } = await params
  const result = await getPublisherWithItems(name)

  if (!result) return null

  return <InterceptedPublisher publisher={result.publisher} items={result.items} />
}
