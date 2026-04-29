-- providers テーブルに解約予約状態を記録するカラムを追加
-- Stripe の cancel_at_period_end: true 時に cancel_at を設定し、
-- cancel_at_period_end: false（解約予約キャンセル）時に null に戻す

ALTER TABLE providers ADD COLUMN IF NOT EXISTS cancel_at timestamptz;

COMMENT ON COLUMN providers.cancel_at IS '解約予約日時。cancel_at_period_end: true の場合に期間終了日を記録。null なら解約予約なし';

-- インデックス（解約予約中の事業主検索用）
CREATE INDEX IF NOT EXISTS idx_providers_cancel_at ON providers (cancel_at) WHERE cancel_at IS NOT NULL;
