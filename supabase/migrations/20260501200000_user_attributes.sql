-- ============================================================
-- Sprint 6: SV-10 ユーザー属性（性別・生年月日）
-- ============================================================

-- users テーブルに gender と birth_date を追加
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS birth_date date;

-- gender のバリデーション
ALTER TABLE public.users
  ADD CONSTRAINT users_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
