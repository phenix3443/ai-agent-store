export interface Publisher {
  id: string
  slug: string
  name: string
  avatarUrl: string
  tier: 'official' | 'verified' | 'community'
  bio?: string
}
