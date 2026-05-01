-- 分析ページ全セクションにフィルター（期間 + セグメント）を適用
-- 1. 既存 _filtered RPCに p_start_date / p_end_date を追加
-- 2. get_ltv_stats_filtered を新規作成（セグメント + 期間フィルター対応）

---------------------------------------------------------------
-- get_popular_menus_filtered: p_start_date / p_end_date 追加
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_popular_menus_filtered(
  p_provider_id bigint,
  p_customer_ids bigint[] DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
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
  SELECT
    s.id,
    s.name,
    COUNT(b.id)
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  WHERE b.provider_id = p_provider_id
    AND b.status = 'confirmed'
    AND b.start_at <= now()
    AND (p_customer_ids IS NULL OR b.customer_user_id = ANY(p_customer_ids))
    AND (p_start_date IS NULL OR b.start_at >= p_start_date)
    AND (p_end_date IS NULL OR b.start_at < p_end_date)
  GROUP BY s.id, s.name
  ORDER BY COUNT(b.id) DESC
  LIMIT 10;
END;
$$;

---------------------------------------------------------------
-- get_booking_heatmap_filtered: p_start_date / p_end_date 追加
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_booking_heatmap_filtered(
  p_provider_id bigint,
  p_customer_ids bigint[] DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
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
  SELECT
    EXTRACT(DOW FROM b.start_at AT TIME ZONE 'Asia/Tokyo')::integer,
    EXTRACT(HOUR FROM b.start_at AT TIME ZONE 'Asia/Tokyo')::integer,
    COUNT(b.id)
  FROM bookings b
  WHERE b.provider_id = p_provider_id
    AND b.status = 'confirmed'
    AND b.start_at <= now()
    AND (p_customer_ids IS NULL OR b.customer_user_id = ANY(p_customer_ids))
    AND (p_start_date IS NULL OR b.start_at >= p_start_date)
    AND (p_end_date IS NULL OR b.start_at < p_end_date)
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;

---------------------------------------------------------------
-- get_avg_booking_interval_filtered: p_start_date / p_end_date 追加
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_avg_booking_interval_filtered(
  p_provider_id bigint,
  p_customer_ids bigint[] DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_interval numeric;
  v_total_customers bigint;
  v_customers_with_interval bigint;
BEGIN
  WITH customer_intervals AS (
    SELECT
      b.customer_user_id,
      CASE WHEN COUNT(*) > 1
        THEN EXTRACT(DAY FROM MAX(b.start_at) - MIN(b.start_at)) / (COUNT(*) - 1)
        ELSE NULL
      END AS avg_interval_days
    FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
      AND (p_customer_ids IS NULL OR b.customer_user_id = ANY(p_customer_ids))
      AND (p_start_date IS NULL OR b.start_at >= p_start_date)
      AND (p_end_date IS NULL OR b.start_at < p_end_date)
    GROUP BY b.customer_user_id
  )
  SELECT
    ROUND(COALESCE(AVG(avg_interval_days) FILTER (WHERE avg_interval_days IS NOT NULL), 0), 1),
    COUNT(*),
    COUNT(*) FILTER (WHERE avg_interval_days IS NOT NULL)
  INTO v_avg_interval, v_total_customers, v_customers_with_interval
  FROM customer_intervals;

  RETURN json_build_object(
    'avg_interval_days', v_avg_interval,
    'total_customers', v_total_customers,
    'customers_with_interval', v_customers_with_interval
  );
END;
$$;

---------------------------------------------------------------
-- get_ltv_stats_filtered: セグメント + 期間フィルター対応の新RPC
-- p_customer_ids でセグメントフィルター、p_start_date / p_end_date で期間フィルター
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ltv_stats_filtered(
  p_provider_id bigint,
  p_customer_ids bigint[] DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_ltv numeric;
  v_excellent bigint := 0;
  v_normal bigint := 0;
  v_dormant bigint := 0;
  v_at_risk bigint := 0;
BEGIN
  WITH customer_data AS (
    SELECT
      b.customer_user_id,
      COUNT(*) AS visit_count,
      SUM(s.price) AS ltv,
      EXTRACT(DAY FROM now() - MAX(b.start_at)) AS days_since_last,
      CASE WHEN COUNT(*) > 1
        THEN EXTRACT(DAY FROM MAX(b.start_at) - MIN(b.start_at)) / (COUNT(*) - 1)
        ELSE NULL
      END AS avg_interval
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
      AND (p_customer_ids IS NULL OR b.customer_user_id = ANY(p_customer_ids))
      AND (p_start_date IS NULL OR b.start_at >= p_start_date)
      AND (p_end_date IS NULL OR b.start_at < p_end_date)
    GROUP BY b.customer_user_id
  )
  SELECT
    COALESCE(AVG(ltv), 0),
    COUNT(*) FILTER (WHERE visit_count >= 5 AND (avg_interval IS NULL OR days_since_last < avg_interval * 1.5)),
    COUNT(*) FILTER (WHERE visit_count >= 2 AND visit_count < 5 AND (avg_interval IS NULL OR days_since_last < avg_interval * 1.5)),
    COUNT(*) FILTER (WHERE avg_interval IS NOT NULL AND days_since_last >= avg_interval * 1.5 AND days_since_last < avg_interval * 3),
    COUNT(*) FILTER (WHERE visit_count = 1 OR (avg_interval IS NOT NULL AND days_since_last >= avg_interval * 3))
  INTO v_avg_ltv, v_excellent, v_normal, v_dormant, v_at_risk
  FROM customer_data;

  RETURN json_build_object(
    'avg_ltv', ROUND(v_avg_ltv),
    'segments', json_build_object(
      'excellent', v_excellent,
      'normal', v_normal,
      'dormant', v_dormant,
      'at_risk', v_at_risk
    )
  );
END;
$$;
