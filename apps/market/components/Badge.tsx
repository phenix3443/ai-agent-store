import type { Publisher } from '@aas/types'

type TierVariant = Publisher['tier']
type CategoryVariant = 'provider' | 'skill' | 'mcp'
export type BadgeVariant = TierVariant | CategoryVariant

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  official:  'bg-ray-official/10 text-ray-official   border-ray-official/20',
  verified:  'bg-ray-verified/10 text-ray-verified   border-ray-verified/20',
  community: 'bg-ray-fg-muted/10 text-ray-fg-secondary border-ray-fg-muted/20',
  provider:  'bg-ray-surface-3  text-ray-fg-secondary border-ray-border',
  skill:     'bg-ray-surface-3  text-ray-fg-secondary border-ray-border',
  mcp:       'bg-ray-surface-3  text-ray-fg-secondary border-ray-border',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
