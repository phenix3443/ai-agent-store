'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface VerifiedToggleProps {
  active: boolean
}

export function VerifiedToggle({ active }: VerifiedToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('store.filters')

  function handleToggle() {
    const params = new URLSearchParams(searchParams.toString())
    if (active) {
      params.delete('verified')
    } else {
      params.set('verified', '1')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={t('verifiedOnly')}
      onClick={handleToggle}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors ${
        active ? 'border-store-accent bg-store-accent-soft' : 'border-store-border bg-store-panel'
      }`}
    >
      <span
        className={`flex h-[18px] w-[30px] items-center rounded-full p-0.5 transition-colors ${
          active ? 'justify-end bg-store-accent' : 'justify-start bg-store-border-strong'
        }`}
      >
        <span className="h-3.5 w-3.5 rounded-full bg-white shadow" />
      </span>
      <span className={`text-xs font-medium ${active ? 'text-store-text' : 'text-store-text-2'}`}>
        {t('verifiedOnly')}
      </span>
    </button>
  )
}
