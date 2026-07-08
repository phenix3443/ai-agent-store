import { getItemBySlug } from '@/lib/catalog'
import { InterceptedDetail } from '@/components/InterceptedDetail'

interface InterceptedDetailProps {
  params: Promise<{ category: string; slug: string }>
}

export default async function InterceptedDetailDrawer({ params }: InterceptedDetailProps) {
  const { slug } = await params
  const item = await getItemBySlug(slug)

  if (!item) return null

  return <InterceptedDetail item={item} />
}
