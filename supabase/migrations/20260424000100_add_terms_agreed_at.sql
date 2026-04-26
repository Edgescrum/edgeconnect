-- LG-3: 利用規約同意日時カラムの追加
-- usersテーブルにterms_agreed_atカラムを追加

ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz;

COMMENT ON COLUMN users.terms_agreed_at IS '利用規約への同意日時';
