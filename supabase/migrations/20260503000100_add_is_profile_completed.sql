-- ============================================================
-- お客さんプロフィール入力必須化: is_profile_completed フラグ追加
-- ============================================================

-- users テーブルに is_profile_completed カラムを追加
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_profile_completed boolean NOT NULL DEFAULT false;

-- 既存ユーザーの移行: customer_name が設定済みのユーザーは完了扱い
UPDATE public.users
  SET is_profile_completed = true
  WHERE customer_name IS NOT NULL AND customer_name != '';
