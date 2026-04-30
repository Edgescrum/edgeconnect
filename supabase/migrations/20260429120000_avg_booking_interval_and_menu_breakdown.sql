-- 1. get_avg_booking_interval: 分析ページ用 - リピート率の代わりに平均予約間隔を表示
CREATE OR REPLACE FUNCTION public.get_avg_booking_interval(
  p_provider_id bigint
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

-- 2. get_customer_menu_breakdown: 顧客詳細ページ用 - 利用メニューの内訳
CREATE OR REPLACE FUNCTION public.get_customer_menu_breakdown(
  p_provider_id bigint,
  p_customer_user_id bigint
)
RETURNS TABLE (
  service_id bigint,
  service_name text,
  booking_count bigint,
  total_revenue bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    COUNT(b.id),
    COALESCE(SUM(s.price), 0)::bigint
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  WHERE b.provider_id = p_provider_id
    AND b.customer_user_id = p_customer_user_id
    AND b.status = 'confirmed'
  GROUP BY s.id, s.name
  ORDER BY COUNT(b.id) DESC;
END;
$$;

-- 3. Update get_category_benchmark to use avg_booking_interval instead of repeat_rate
CREATE OR REPLACE FUNCTION public.get_category_benchmark(
  p_category text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_count bigint;
  v_avg_bookings numeric;
  v_avg_revenue numeric;
  v_avg_interval numeric;
BEGIN
  SELECT COUNT(*) INTO v_provider_count
  FROM providers
  WHERE category = p_category AND is_active = true;

  IF v_provider_count < 5 THEN
    RETURN json_build_object('available', false, 'provider_count', v_provider_count);
  END IF;

  -- 月間平均予約数
  WITH provider_monthly AS (
    SELECT b.provider_id, COUNT(*) AS monthly_count
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    WHERE p.category = p_category AND p.is_active = true
      AND b.status = 'confirmed'
      AND b.start_at >= date_trunc('month', now())
    GROUP BY b.provider_id
  )
  SELECT COALESCE(AVG(monthly_count), 0) INTO v_avg_bookings FROM provider_monthly;

  -- 月間平均売上
  WITH provider_revenue AS (
    SELECT b.provider_id, COALESCE(SUM(s.price), 0) AS monthly_rev
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    JOIN services s ON s.id = b.service_id
    WHERE p.category = p_category AND p.is_active = true
      AND b.status = 'confirmed'
      AND b.start_at >= date_trunc('month', now())
    GROUP BY b.provider_id
  )
  SELECT COALESCE(AVG(monthly_rev), 0) INTO v_avg_revenue FROM provider_revenue;

  -- 平均予約間隔（事業者ごとの顧客平均間隔の全体平均）
  WITH customer_intervals AS (
    SELECT
      b.provider_id,
      b.customer_user_id,
      CASE WHEN COUNT(*) > 1
        THEN EXTRACT(DAY FROM MAX(b.start_at) - MIN(b.start_at)) / (COUNT(*) - 1)
        ELSE NULL
      END AS avg_interval
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    WHERE p.category = p_category AND p.is_active = true
      AND b.status = 'confirmed'
    GROUP BY b.provider_id, b.customer_user_id
  ),
  provider_avg AS (
    SELECT provider_id, AVG(avg_interval) AS avg_interval
    FROM customer_intervals
    WHERE avg_interval IS NOT NULL
    GROUP BY provider_id
  )
  SELECT COALESCE(AVG(avg_interval), 0) INTO v_avg_interval FROM provider_avg;

  RETURN json_build_object(
    'available', true,
    'provider_count', v_provider_count,
    'avg_monthly_bookings', ROUND(v_avg_bookings, 1),
    'avg_monthly_revenue', ROUND(v_avg_revenue),
    'avg_booking_interval', ROUND(v_avg_interval, 1)
  );
END;
$$;
