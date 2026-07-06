import { getItemBySlug } from '@/lib/catalog'
import { InterceptedDetail } from '@/components/InterceptedDetail'

interface InterceptedDetailProps {
  params: { category: string; slug: string }
}

export default async function InterceptedDetailDrawer({ params }: InterceptedDetailProps) {
  const item = await getItemBySlug(params.slug)

  if (!item) return null

  return <InterceptedDetail item={item} />
}
