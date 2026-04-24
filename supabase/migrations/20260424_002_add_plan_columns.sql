-- ST-2: providersテーブルにプラン管理カラムを追加

-- プランカラム（既存事業主はbasicとして扱う）
ALTER TABLE providers ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'basic'
  CHECK (plan IN ('basic', 'standard', 'team'));

-- Stripe連携カラム
ALTER TABLE providers ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS plan_period_end timestamptz;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- インデックス（Webhook受信時の検索用）
CREATE INDEX IF NOT EXISTS idx_providers_stripe_customer_id ON providers (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_providers_stripe_subscription_id ON providers (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN providers.plan IS '契約プラン: basic, standard, team';
COMMENT ON COLUMN providers.stripe_customer_id IS 'StripeのCustomer ID';
COMMENT ON COLUMN providers.stripe_subscription_id IS 'StripeのSubscription ID';
COMMENT ON COLUMN providers.plan_period_end IS '現在のプラン期間終了日';
COMMENT ON COLUMN providers.trial_ends_at IS 'トライアル期間終了日';
