import { getItems, getFeaturedItems } from '@/lib/catalog'
import { Header } from '@/components/Header'
import { FeaturedCarousel } from '@/components/FeaturedCarousel'
import { CategoryTabs } from '@/components/CategoryTabs'
import { SortSelect } from '@/components/SortSelect'
import { SearchInput } from '@/components/SearchInput'
import { VerifiedToggle } from '@/components/VerifiedToggle'
import { ItemGrid } from '@/components/ItemGrid'
import { PublishModalTrigger } from '@/components/PublishModalTrigger'

interface StorePageProps {
  searchParams: {
    category?: string
    q?: string
    sort?: string
    verified?: string
  }
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const rawCategory = searchParams.category
  const category =
    rawCategory === 'provider' || rawCategory === 'skill' || rawCategory === 'mcp'
      ? rawCategory
      : null

  const sort =
    searchParams.sort === 'created' || searchParams.sort === 'rating'
      ? searchParams.sort
      : 'downloads'

  const verifiedOnly = searchParams.verified === '1'

  const allItems = await getItems({ category, q: searchParams.q, sort })
  const items = verifiedOnly
    ? allItems.filter((item) => item.publisher.tier !== 'community')
    : allItems
  const featured = await getFeaturedItems()

  return (
    <>
      <Header />
      <PublishModalTrigger />
      <main className="flex flex-col gap-6 py-8">
        <FeaturedCarousel items={featured} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SortSelect active={sort} />
          <div className="flex flex-wrap items-center gap-2.5">
            <CategoryTabs active={category ?? 'all'} />
            <VerifiedToggle active={verifiedOnly} />
            <SearchInput defaultValue={searchParams.q} />
          </div>
        </div>

        <ItemGrid items={items} />
      </main>
    </>
  )
}
