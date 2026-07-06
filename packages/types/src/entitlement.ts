/** The subscription plan a user is on. `free` is the default for anyone not signed in. */
export type Plan = 'free' | 'pro' | 'team'

/** Subscription status as reported by the billing backend (mirrors Stripe subscription statuses we care about). */
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

/**
 * Feature flags gated by plan, resolved from a user's active plan. Every gated Pro feature
 * gets a boolean here so the client can check a single flag instead of re-deriving from `plan`.
 */
export interface Entitlements {
  plan: Plan
  /** Advanced usage analytics: budgets, project/time breakdowns, overspend alerts, export. */
  advancedUsageAnalytics: boolean
  /** Smart cost/capability-based routing beyond manual level ordering. */
  smartRouting: boolean
  /** Multi-key rotation per provider to bypass rate limits. */
  keyRotation: boolean
}
