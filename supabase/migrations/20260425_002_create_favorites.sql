-- FV-1: お気に入りテーブル作成

CREATE TABLE IF NOT EXISTS favorites (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id int NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

-- RLSを有効化
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 自分のお気に入りのみ読み書き可能
-- SELECT: 自分のお気に入りのみ閲覧可能
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_uid = auth.uid()::text
    )
  );

-- INSERT: 自分のお気に入りのみ追加可能
CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_uid = auth.uid()::text
    )
  );

-- DELETE: 自分のお気に入りのみ削除可能
CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_uid = auth.uid()::text
    )
  );

-- インデックス
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_provider_id ON favorites (provider_id);

COMMENT ON TABLE favorites IS 'お気に入り（ユーザー→事業主）';
COMMENT ON COLUMN favorites.user_id IS 'お気に入りを登録したユーザーのID';
COMMENT ON COLUMN favorites.provider_id IS 'お気に入り対象の事業主ID';
