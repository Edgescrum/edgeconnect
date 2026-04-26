-- ST-8: ダウングレード日時を記録するカラムを追加
-- 3ヶ月経過後のデータ削除判定に使用

ALTER TABLE providers ADD COLUMN IF NOT EXISTS downgraded_at timestamptz;

COMMENT ON COLUMN providers.downgraded_at IS 'スタンダード→ベーシックにダウングレードした日時。3ヶ月後にスタンダード機能データを削除';

-- インデックス（cronジョブでの検索用）
CREATE INDEX IF NOT EXISTS idx_providers_downgraded_at ON providers (downgraded_at) WHERE downgraded_at IS NOT NULL;
