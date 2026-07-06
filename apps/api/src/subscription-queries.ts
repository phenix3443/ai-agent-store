import type { Plan } from '@as/types'
import { getSupabaseAdmin, type SupabaseEnv } from './supabase'
import { planForSubscription, type SubscriptionRecord, type SubscriptionStatus } from './billing'

/** Whether a webhook delivery id has already been processed (idempotent dedup). */
export async function isWebhookProcessed(env: SupabaseEnv | undefined, deliveryId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin(env)
  const { data } = await supabase
    .from('processed_webhooks')
    .select('delivery_id')
    .eq('delivery_id', deliveryId)
    .maybeSingle()
  return data != null
}

/** Records a webhook delivery id as processed. */
export async function markWebhookProcessed(
  env: SupabaseEnv | undefined,
  deliveryId: string,
  eventType: string
): Promise<void> {
  const supabase = getSupabaseAdmin(env)
  await supabase.from('processed_webhooks').insert({ delivery_id: deliveryId, event_type: eventType })
}

/** Upserts a subscription row keyed by its Waffo order id. */
export async function upsertSubscription(env: SupabaseEnv | undefined, record: SubscriptionRecord): Promise<void> {
  const supabase = getSupabaseAdmin(env)
  const { error } = await supabase.from('subscriptions').upsert(
    {
      waffo_order_id: record.waffoOrderId,
      buyer_email: record.buyerEmail,
      buyer_identity: record.buyerIdentity,
      plan: record.plan,
      status: record.status,
      product_name: record.productName,
      waffo_store_id: record.storeId,
      mode: record.mode,
      event_timestamp: record.eventTimestamp,
    },
    { onConflict: 'waffo_order_id' }
  )
  if (error) throw new Error(error.message)
}

/** Resolves the current entitlement plan for a buyer email from their most recent subscription row. */
export async function getPlanByEmail(env: SupabaseEnv | undefined, email: string): Promise<Plan> {
  const supabase = getSupabaseAdmin(env)
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, event_timestamp')
    .ilike('buyer_email', email)
    .order('event_timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return 'free'
  const row = data as { plan: Plan; status: SubscriptionStatus }
  return planForSubscription(row.status, row.plan)
}

/** Resolves the current entitlement plan for an authenticated app user from their most recent subscription row. */
export async function getPlanByUserId(env: SupabaseEnv | undefined, userId: string): Promise<Plan> {
  const supabase = getSupabaseAdmin(env)
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, event_timestamp')
    .eq('buyer_identity', userId)
    .order('event_timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return 'free'
  const row = data as { plan: Plan; status: SubscriptionStatus }
  return planForSubscription(row.status, row.plan)
}
