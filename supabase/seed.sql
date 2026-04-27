-- ============================================================
-- Seed Data
-- 新しい環境をセットアップした際に実行する
-- ============================================================

-- カテゴリマスタ
INSERT INTO public.categories (value, label, sort_order, is_active) VALUES
  ('beauty', '美容・ヘアサロン', 1, true),
  ('health', '整体・マッサージ', 2, true),
  ('fitness', 'フィットネス・ヨガ', 3, true),
  ('coaching', 'コーチング・カウンセリング', 4, true),
  ('education', '教育・レッスン', 5, true),
  ('medical', '医療・クリニック', 6, true),
  ('pet', 'ペット', 7, true),
  ('consulting', 'コンサルティング', 8, true),
  ('photography', '撮影・写真', 9, true),
  ('other', 'その他', 99, true)
ON CONFLICT (value) DO NOTHING;

-- Storage バケット
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
