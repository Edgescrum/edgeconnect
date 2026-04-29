-- SUB-1: providers テーブルに subscription_status カラムを追加する
-- 許容値: active / trialing / past_due / inactive
-- デフォルト値: inactive

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'inactive';

-- 既存データのマイグレーション:
-- stripe_subscription_id が存在する → active
-- stripe_subscription_id が NULL → inactive (デフォルト値のまま)
UPDATE public.providers
SET subscription_status = 'active'
WHERE stripe_subscription_id IS NOT NULL;

-- CHECK 制約で許容値を制限する
ALTER TABLE public.providers
  ADD CONSTRAINT providers_subscription_status_check
  CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'inactive'));

-- get_provider_profile RPC に subscription_status を追加する
-- 公開ページで受付停止表示の判定に必要
CREATE OR REPLACE FUNCTION public.get_provider_profile(p_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_result json;
begin
  select json_build_object(
    'id', p.id,
    'slug', p.slug,
    'name', p.name,
    'bio', p.bio,
    'icon_url', p.icon_url,
    'line_contact_url', p.line_contact_url,
    'contact_email', p.contact_email,
    'brand_color', coalesce(p.brand_color, '#6366f1'),
    'category', p.category,
    'subscription_status', p.subscription_status,
    'services', coalesce((
      select json_agg(
        json_build_object(
          'id', s.id,
          'name', s.name,
          'caption', s.caption,
          'description', s.description,
          'duration_min', s.duration_min,
          'price', s.price,
          'custom_fields', s.custom_fields
        ) order by s.sort_order
      )
      from public.services s
      where s.provider_id = p.id and s.is_published = true
    ), '[]'::json)
  ) into v_result
  from public.providers p
  where p.slug = p_slug and p.is_active = true;

  return v_result;
end;
$$;
