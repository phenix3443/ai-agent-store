import { getPublisherBySlug, getPublisherItems } from '@/lib/catalog'
import { InterceptedPublisher } from '@/components/InterceptedPublisher'

interface InterceptedPublisherProps {
  params: { name: string }
}

export default async function InterceptedPublisherDrawer({ params }: InterceptedPublisherProps) {
  const publisher = await getPublisherBySlug(params.name)

  if (!publisher) return null

  const items = await getPublisherItems(params.name)

  return <InterceptedPublisher publisher={publisher} items={items} />
}
