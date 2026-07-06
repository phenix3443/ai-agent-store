-- Subscriptions synced from Waffo Pancake (Merchant of Record) webhooks.
-- One row per Waffo subscription/order, keyed by waffo_order_id. Entitlement
-- resolution reads the most recent row for a buyer email and grants the plan
-- while the subscription is in an active-ish status.
CREATE TABLE subscriptions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  waffo_order_id   text        UNIQUE NOT NULL,
  buyer_email      text        NOT NULL,
  -- merchantProvidedBuyerIdentity from the checkout session; reserved for binding
  -- a subscription to an authenticated app user once accounts land (Phase 2).
  buyer_identity   text,
  plan             text        NOT NULL DEFAULT 'pro' CHECK (plan IN ('pro', 'team')),
  status           text        NOT NULL CHECK (status IN ('active', 'canceling', 'canceled', 'past_due', 'trialing')),
  product_name     text,
  waffo_store_id   text        NOT NULL,
  mode             text        NOT NULL DEFAULT 'prod' CHECK (mode IN ('test', 'prod')),
  event_timestamp  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_buyer_email_idx ON subscriptions(lower(buyer_email));

-- update_updated_at() is defined in 001_initial.sql.
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Idempotent webhook dedup — one row per Waffo delivery id (event.id).
CREATE TABLE processed_webhooks (
  delivery_id   text        PRIMARY KEY,
  event_type    text        NOT NULL,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: billing data is not publicly readable. No anon/public policies are
-- defined, so only the service role (used by the API webhook + entitlement
-- handlers) can read or write these tables.
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;
