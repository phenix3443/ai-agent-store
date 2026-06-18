'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Category = 'all' | 'provider' | 'skill' | 'mcp'

interface CategoryTabsProps {
  active: Category
}

const TABS: { value: Category; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'provider', label: 'Providers' },
  { value: 'skill',    label: 'Skills' },
  { value: 'mcp',      label: 'MCPs' },
]

export function CategoryTabs({ active }: CategoryTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleSelect(value: Category) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-lg border border-ray-border bg-ray-surface-1 p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => handleSelect(tab.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.value
              ? 'bg-ray-surface-3 text-ray-fg'
              : 'text-ray-fg-secondary hover:text-ray-fg'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
