-- トライアル重複防止: had_trial フラグを追加
-- 一度トライアルを利用した事業主には再度トライアルを適用しない

ALTER TABLE providers ADD COLUMN IF NOT EXISTS had_trial boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN providers.had_trial IS '過去にトライアルを利用したかどうか。true の場合、再登録時にトライアルを適用しない';

-- Stripe 登録用メールアドレス
ALTER TABLE providers ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN providers.email IS 'Stripe 登録用メールアドレス。請求書送付先として使用';
