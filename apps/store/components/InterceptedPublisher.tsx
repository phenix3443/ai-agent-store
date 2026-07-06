'use client'

import type { Item, Publisher } from '@as/types'
import { useRouter } from 'next/navigation'
import { PublisherDrawer } from './PublisherDrawer'

export function InterceptedPublisher({ publisher, items }: { publisher: Publisher; items: Item[] }) {
  const router = useRouter()

  return (
    <PublisherDrawer
      publisher={publisher}
      items={items}
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    />
  )
}
