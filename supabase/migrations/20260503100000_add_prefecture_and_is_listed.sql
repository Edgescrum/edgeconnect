-- Sprint 10: 都道府県カラムと探すページ公開フラグの追加

-- #156: providers テーブルに prefecture カラム追加
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS prefecture text DEFAULT NULL;

-- #157: providers テーブルに is_listed カラム追加（デフォルト false）
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS is_listed boolean DEFAULT false NOT NULL;

-- search_providers RPC を更新: is_listed フィルター + prefecture フィルター追加
CREATE OR REPLACE FUNCTION public.search_providers(
  p_categories text[] DEFAULT NULL,
  p_query text DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 20,
  p_prefecture text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_result json;
begin
  select json_agg(row_to_json(t)) into v_result
  from (
    select
      p.slug,
      p.name,
      p.bio,
      p.icon_url,
      p.category,
      p.brand_color,
      p.prefecture,
      (
        select round(avg(sr.csat)::numeric, 1)
        from public.survey_responses sr
        where sr.provider_id = p.id
      ) as avg_csat,
      (
        select count(*)::integer
        from public.survey_responses sr
        where sr.provider_id = p.id
          and sr.review_public = true
          and sr.review_visible = true
          and sr.review_text is not null
          and sr.review_text <> ''
      ) as review_count
    from public.providers p
    where p.is_active = true
      and p.is_listed = true
      and exists (
        select 1 from public.services s
        where s.provider_id = p.id and s.is_published = true
      )
      and (p_categories is null or p.category = any(p_categories))
      and (p_prefecture is null or p.prefecture = p_prefecture)
      and (
        p_query is null
        or p.name ilike '%' || p_query || '%'
        or p.bio ilike '%' || p_query || '%'
      )
    order by p.id desc
    offset p_offset
    limit p_limit
  ) t;

  return coalesce(v_result, '[]'::json);
end;
$$;

-- get_provider_profile RPC を更新: prefecture を含める
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
    'prefecture', p.prefecture,
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
          u.display_name as customer_name
        from public.survey_responses sr
        join public.users u on u.id = sr.customer_user_id
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
