-- providers テーブルの RLS セキュリティ強化
-- providers_select_public ポリシーが USING (true) で全カラム（Stripe 関連含む）を公開していた
-- 公開プロフィール表示は get_provider_profile / search_providers RPC（SECURITY DEFINER）経由で行う
-- 事業主自身のデータは providers_select_own ポリシーで取得可能

-- 1. 危険な公開ポリシーを削除
DROP POLICY IF EXISTS providers_select_public ON public.providers;

-- 2. providers_public View を拡張（brand_color, category を追加）
DROP VIEW IF EXISTS public.providers_public;
CREATE VIEW public.providers_public AS
  SELECT id, slug, name, bio, icon_url, is_active, brand_color, category
  FROM providers
  WHERE is_active = true;
