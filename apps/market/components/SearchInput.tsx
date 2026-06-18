'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

interface SearchInputProps {
  placeholder?: string
  defaultValue?: string
}

export function SearchInput({
  placeholder = 'Search providers, skills, MCPs...',
  defaultValue = '',
}: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-ray-fg-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        data-pending={isPending ? '' : undefined}
        className="w-full rounded-lg border border-ray-border bg-ray-surface-1 py-2 pl-9 pr-4 text-sm text-ray-fg placeholder:text-ray-fg-muted focus:border-ray-border-hover focus:outline-none"
      />
    </div>
  )
}
