'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'

interface SearchInputProps {
  defaultValue?: string
}

export function SearchInput({ defaultValue = '' }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('store.search')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.trim()
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const placeholder = t('placeholder')

  return (
    <div className="flex h-[34px] items-center gap-2 rounded-[10px] border border-store-border bg-store-panel px-3 focus-within:border-store-accent">
      <Search size={14} className="shrink-0 text-store-text-3" />
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        data-pending={isPending ? '' : undefined}
        className="min-w-0 flex-1 bg-transparent text-sm text-store-text placeholder:text-store-text-3 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      <span className="shrink-0 rounded bg-store-code-bg px-1.5 py-0.5 font-mono text-[10px] text-store-text-3">
        ⌘K
      </span>
    </div>
  )
}
