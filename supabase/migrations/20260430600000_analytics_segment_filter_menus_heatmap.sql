-- 分析ページ: 人気メニュー・ヒートマップにも p_segment フィルターを追加

---------------------------------------------------------------
-- get_popular_menus にセグメントフィルターを追加
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_popular_menus(
  p_provider_id bigint,
  p_segment text DEFAULT NULL
)
RETURNS TABLE (
  service_id bigint,
  service_name text,
  booking_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH segment_customers AS (
    SELECT sc.customer_user_id AS cuid
    FROM get_segment_customer_ids(p_provider_id, p_segment) sc
  )
  SELECT
    s.id,
    s.name,
    COUNT(b.id)
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  WHERE b.provider_id = p_provider_id
    AND b.status = 'confirmed'
    AND b.start_at <= now()
    AND (p_segment IS NULL OR p_segment = '' OR p_segment = 'all' OR b.customer_user_id IN (SELECT cuid FROM segment_customers))
  GROUP BY s.id, s.name
  ORDER BY COUNT(b.id) DESC
  LIMIT 10;
END;
$$;

---------------------------------------------------------------
-- get_booking_heatmap にセグメントフィルターを追加
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_booking_heatmap(
  p_provider_id bigint,
  p_segment text DEFAULT NULL
)
RETURNS TABLE (
  day_of_week integer,
  hour_of_day integer,
  booking_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH segment_customers AS (
    SELECT sc.customer_user_id AS cuid
    FROM get_segment_customer_ids(p_provider_id, p_segment) sc
  )
  SELECT
    EXTRACT(DOW FROM b.start_at AT TIME ZONE 'Asia/Tokyo')::integer,
    EXTRACT(HOUR FROM b.start_at AT TIME ZONE 'Asia/Tokyo')::integer,
    COUNT(b.id)
  FROM bookings b
  WHERE b.provider_id = p_provider_id
    AND b.status = 'confirmed'
    AND b.start_at <= now()
    AND (p_segment IS NULL OR p_segment = '' OR p_segment = 'all' OR b.customer_user_id IN (SELECT cuid FROM segment_customers))
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;
