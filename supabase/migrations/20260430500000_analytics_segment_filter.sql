-- Sprint 4 UAT: 分析ページの顧客セグメントフィルター対応
-- 各分析RPCに p_segment パラメータを追加し、セグメントでフィルタリング可能にする

---------------------------------------------------------------
-- ヘルパー: 指定セグメントに属する顧客IDを返す関数
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_segment_customer_ids(
  p_provider_id bigint,
  p_segment text DEFAULT NULL -- 'excellent' | 'normal' | 'dormant' | 'at_risk' | NULL(全体)
)
RETURNS TABLE (customer_user_id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_segment IS NULL OR p_segment = '' OR p_segment = 'all' THEN
    -- 全顧客を返す
    RETURN QUERY
    SELECT DISTINCT b.customer_user_id
    FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now();
    RETURN;
  END IF;

  RETURN QUERY
  WITH customer_data AS (
    SELECT
      b.customer_user_id AS cuid,
      COUNT(*) AS visit_count,
      EXTRACT(DAY FROM now() - MAX(b.start_at)) AS days_since_last,
      CASE WHEN COUNT(*) > 1
        THEN EXTRACT(DAY FROM MAX(b.start_at) - MIN(b.start_at)) / (COUNT(*) - 1)
        ELSE NULL
      END AS avg_interval
    FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
    GROUP BY b.customer_user_id
  )
  SELECT cd.cuid
  FROM customer_data cd
  WHERE
    CASE p_segment
      WHEN 'excellent' THEN
        cd.visit_count >= 5 AND (cd.avg_interval IS NULL OR cd.days_since_last < cd.avg_interval * 1.5)
      WHEN 'normal' THEN
        cd.visit_count >= 2 AND cd.visit_count < 5 AND (cd.avg_interval IS NULL OR cd.days_since_last < cd.avg_interval * 1.5)
      WHEN 'dormant' THEN
        cd.avg_interval IS NOT NULL AND cd.days_since_last >= cd.avg_interval * 1.5 AND cd.days_since_last < cd.avg_interval * 3
      WHEN 'at_risk' THEN
        cd.visit_count = 1 OR (cd.avg_interval IS NOT NULL AND cd.days_since_last >= cd.avg_interval * 3)
      ELSE true
    END;
END;
$$;

---------------------------------------------------------------
-- get_monthly_stats にセグメントフィルターを追加
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_monthly_stats(
  p_provider_id bigint,
  p_months integer DEFAULT 6,
  p_segment text DEFAULT NULL
)
RETURNS TABLE (
  month text,
  booking_count bigint,
  revenue bigint,
  cancel_count bigint,
  cancel_rate numeric,
  unique_customers bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH segment_customers AS (
    SELECT sc.customer_user_id AS cuid
    FROM get_segment_customer_ids(p_provider_id, p_segment) sc
  ),
  months AS (
    SELECT to_char(d, 'YYYY-MM') AS m, d AS month_start, d + interval '1 month' AS month_end
    FROM generate_series(
      date_trunc('month', now()) - ((p_months - 1) || ' months')::interval,
      date_trunc('month', now()),
      interval '1 month'
    ) d
  )
  SELECT
    mo.m,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed'),
    COALESCE(SUM(s.price) FILTER (WHERE b.status = 'confirmed'), 0)::bigint,
    COUNT(b.id) FILTER (WHERE b.status = 'cancelled'),
    CASE WHEN COUNT(b.id) > 0
      THEN ROUND(COUNT(b.id) FILTER (WHERE b.status = 'cancelled')::numeric / COUNT(b.id) * 100, 1)
      ELSE 0
    END,
    COUNT(DISTINCT b.customer_user_id) FILTER (WHERE b.status = 'confirmed')
  FROM months mo
  LEFT JOIN bookings b ON b.provider_id = p_provider_id
    AND b.start_at >= mo.month_start
    AND b.start_at < mo.month_end
    AND b.start_at <= now()
    AND (p_segment IS NULL OR p_segment = '' OR p_segment = 'all' OR b.customer_user_id IN (SELECT cuid FROM segment_customers))
  LEFT JOIN services s ON s.id = b.service_id
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;

---------------------------------------------------------------
-- get_avg_booking_interval にセグメントフィルターを追加
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_avg_booking_interval(
  p_provider_id bigint,
  p_segment text DEFAULT NULL
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
  WITH segment_customers AS (
    SELECT sc.customer_user_id AS cuid
    FROM get_segment_customer_ids(p_provider_id, p_segment) sc
  ),
  customer_intervals AS (
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
      AND (p_segment IS NULL OR p_segment = '' OR p_segment = 'all' OR b.customer_user_id IN (SELECT cuid FROM segment_customers))
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
-- get_monthly_avg_interval にセグメントフィルターを追加
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_monthly_avg_interval(
  p_provider_id bigint,
  p_months integer DEFAULT 24,
  p_segment text DEFAULT NULL
)
RETURNS TABLE (
  month text,
  avg_interval_days numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH segment_customers AS (
    SELECT sc.customer_user_id AS cuid
    FROM get_segment_customer_ids(p_provider_id, p_segment) sc
  ),
  months AS (
    SELECT
      to_char(d, 'YYYY-MM') AS m,
      d AS month_start,
      d + interval '1 month' AS month_end
    FROM generate_series(
      date_trunc('month', now()) - ((p_months - 1) || ' months')::interval,
      date_trunc('month', now()),
      interval '1 month'
    ) d
  ),
  monthly_intervals AS (
    SELECT
      mo.m,
      b.customer_user_id,
      CASE WHEN COUNT(*) > 1
        THEN EXTRACT(DAY FROM MAX(b.start_at) - MIN(b.start_at)) / (COUNT(*) - 1)
        ELSE NULL
      END AS customer_avg_interval
    FROM months mo
    JOIN bookings b ON b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at < mo.month_end
      AND b.start_at <= now()
      AND (p_segment IS NULL OR p_segment = '' OR p_segment = 'all' OR b.customer_user_id IN (SELECT cuid FROM segment_customers))
    GROUP BY mo.m, mo.month_start, b.customer_user_id
  )
  SELECT
    mo.m,
    ROUND(COALESCE(AVG(mi.customer_avg_interval) FILTER (WHERE mi.customer_avg_interval IS NOT NULL), 0), 1)
  FROM months mo
  LEFT JOIN monthly_intervals mi ON mi.m = mo.m
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;
