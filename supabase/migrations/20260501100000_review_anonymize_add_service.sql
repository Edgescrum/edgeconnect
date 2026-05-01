-- ============================================================
-- 口コミの匿名化 + サービス名追加
-- - get_provider_reviews: customer_name を除外、service_name を追加
-- - get_provider_profile の recent_reviews: customer_name を除外、service_name を追加
-- ============================================================

-- 1. get_provider_reviews RPC を更新
CREATE OR REPLACE FUNCTION public.get_provider_reviews(
  p_slug text,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 20
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_result json;
  v_provider_id bigint;
begin
  select id into v_provider_id
  from public.providers
  where slug = p_slug and is_active = true;

  if v_provider_id is null then
    return '[]'::json;
  end if;

  select json_agg(row_to_json(t)) into v_result
  from (
    select
      sr.id,
      sr.csat,
      sr.review_text,
      sr.created_at,
      s.name as service_name
    from public.survey_responses sr
    left join public.bookings b on b.id = sr.booking_id
    left join public.services s on s.id = b.service_id
    where sr.provider_id = v_provider_id
      and sr.review_public = true
      and sr.review_visible = true
      and sr.review_text is not null
      and sr.review_text <> ''
    order by sr.created_at desc
    offset p_offset
    limit p_limit
  ) t;

  return coalesce(v_result, '[]'::json);
end;
$$;

-- 2. get_provider_profile RPC を更新（recent_reviews 部分の修正）
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
    'review_summary', (
      select json_build_object(
        'avg_csat', round(avg(sr.csat)::numeric, 1),
        'count', count(*)
      )
      from public.survey_responses sr
      where sr.provider_id = p.id
        and sr.review_public = true
        and sr.review_visible = true
        and sr.review_text is not null
        and sr.review_text <> ''
    ),
    'csat_summary', (
      select json_build_object(
        'avg_csat', round(avg(sr.csat)::numeric, 1),
        'count', count(*)
      )
      from public.survey_responses sr
      where sr.provider_id = p.id
    ),
    'recent_reviews', coalesce((
      select json_agg(r order by r.created_at desc)
      from (
        select
          sr.id,
          sr.csat,
          sr.review_text,
          sr.created_at,
          s.name as service_name
        from public.survey_responses sr
        left join public.bookings b on b.id = sr.booking_id
        left join public.services s on s.id = b.service_id
        where sr.provider_id = p.id
          and sr.review_public = true
          and sr.review_visible = true
          and sr.review_text is not null
          and sr.review_text <> ''
        order by sr.created_at desc
        limit 3
      ) r
    ), '[]'::json),
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
