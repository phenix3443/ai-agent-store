'use client'

import type { Item } from '@as/types'
import { useRouter } from 'next/navigation'
import { DetailDrawer } from './DetailDrawer'

export function InterceptedDetail({ item }: { item: Item }) {
  const router = useRouter()

  return (
    <DetailDrawer
      item={item}
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    />
  )
}
