-- Fix: 全ての分析RPCから未来の予約（start_at > now()）を除外する
-- 問題: 分析・KPI計算に未来の予約が含まれ、「前回来店からの経過 -14日前」などのマイナス値が表示される

---------------------------------------------------------------
-- get_customers — 顧客一覧（過去の予約のみ集計）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_customers(
  p_provider_id bigint,
  p_query text DEFAULT NULL,
  p_filter text DEFAULT 'all'
)
RETURNS TABLE (
  customer_user_id bigint,
  display_name text,
  customer_name text,
  booking_count bigint,
  last_visit_date timestamptz,
  last_menu_name text,
  days_since_last_visit integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH customer_stats AS (
    SELECT
      b.customer_user_id AS cuid,
      COUNT(*) AS bcount,
      MAX(b.start_at) AS last_visit,
      (SELECT s.name FROM services s WHERE s.id = (
        SELECT b2.service_id FROM bookings b2
        WHERE b2.provider_id = p_provider_id
          AND b2.customer_user_id = b.customer_user_id
          AND b2.status = 'confirmed'
          AND b2.start_at <= now()
        ORDER BY b2.start_at DESC LIMIT 1
      )) AS last_menu,
      EXTRACT(DAY FROM now() - MAX(b.start_at))::integer AS days_since
    FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
    GROUP BY b.customer_user_id
  )
  SELECT
    cs.cuid,
    u.display_name,
    u.customer_name,
    cs.bcount,
    cs.last_visit,
    cs.last_menu,
    cs.days_since
  FROM customer_stats cs
  JOIN users u ON u.id = cs.cuid
  WHERE
    (p_query IS NULL OR p_query = '' OR
     u.display_name ILIKE '%' || p_query || '%' OR
     u.customer_name ILIKE '%' || p_query || '%')
    AND (
      p_filter = 'all'
      OR (p_filter = '1month' AND cs.days_since >= 30)
      OR (p_filter = '3months' AND cs.days_since >= 90)
    )
  ORDER BY cs.last_visit DESC NULLS LAST;
END;
$$;

---------------------------------------------------------------
-- get_customer_detail — 顧客詳細（過去の予約のみ集計）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_customer_detail(
  p_provider_id bigint,
  p_customer_user_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_user record;
  v_stats record;
  v_churn_risk numeric;
BEGIN
  SELECT id, display_name, customer_name, customer_phone, created_at
  INTO v_user
  FROM users WHERE id = p_customer_user_id;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  SELECT
    COUNT(*) AS total_bookings,
    COALESCE(SUM(s.price), 0) AS total_revenue,
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(s.price), 0) / COUNT(*) ELSE 0 END AS avg_price,
    MIN(b.start_at) AS first_visit,
    MAX(b.start_at) AS last_visit,
    CASE WHEN COUNT(*) > 1
      THEN EXTRACT(DAY FROM MAX(b.start_at) - MIN(b.start_at)) / (COUNT(*) - 1)
      ELSE NULL
    END AS avg_interval_days
  INTO v_stats
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  WHERE b.provider_id = p_provider_id
    AND b.customer_user_id = p_customer_user_id
    AND b.status = 'confirmed'
    AND b.start_at <= now();

  IF v_stats.avg_interval_days IS NOT NULL AND v_stats.avg_interval_days > 0 THEN
    v_churn_risk := EXTRACT(DAY FROM now() - v_stats.last_visit) / v_stats.avg_interval_days;
  ELSE
    v_churn_risk := NULL;
  END IF;

  v_result := json_build_object(
    'user_id', v_user.id,
    'display_name', v_user.display_name,
    'customer_name', v_user.customer_name,
    'customer_phone', v_user.customer_phone,
    'total_bookings', v_stats.total_bookings,
    'total_revenue', v_stats.total_revenue,
    'avg_price', v_stats.avg_price,
    'first_visit', v_stats.first_visit,
    'last_visit', v_stats.last_visit,
    'avg_interval_days', ROUND(v_stats.avg_interval_days),
    'churn_risk', ROUND(v_churn_risk::numeric, 2),
    'days_since_last_visit', GREATEST(EXTRACT(DAY FROM now() - v_stats.last_visit)::integer, 0)
  );

  RETURN v_result;
END;
$$;

---------------------------------------------------------------
-- get_customer_monthly_visits — 月別来店数（過去の予約のみ）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_customer_monthly_visits(
  p_provider_id bigint,
  p_customer_user_id bigint
)
RETURNS TABLE (
  month text,
  visit_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT to_char(d, 'YYYY-MM') AS m, d AS month_start, d + interval '1 month' AS month_end
    FROM generate_series(
      date_trunc('month', now()) - interval '5 months',
      date_trunc('month', now()),
      interval '1 month'
    ) d
  )
  SELECT
    mo.m,
    COUNT(b.id)
  FROM months mo
  LEFT JOIN bookings b ON b.provider_id = p_provider_id
    AND b.customer_user_id = p_customer_user_id
    AND b.status = 'confirmed'
    AND b.start_at >= mo.month_start
    AND b.start_at < mo.month_end
    AND b.start_at <= now()
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;

---------------------------------------------------------------
-- get_customer_menu_breakdown — メニュー内訳（過去の予約のみ）
---------------------------------------------------------------
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
    AND b.start_at <= now()
  GROUP BY s.id, s.name
  ORDER BY COUNT(b.id) DESC;
END;
$$;

---------------------------------------------------------------
-- get_monthly_stats — 月間統計（過去の予約のみ）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_monthly_stats(
  p_provider_id bigint,
  p_months integer DEFAULT 6
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
  WITH months AS (
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
  LEFT JOIN services s ON s.id = b.service_id
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;

---------------------------------------------------------------
-- get_avg_booking_interval — 平均予約間隔（過去の予約のみ）
---------------------------------------------------------------
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
      AND b.start_at <= now()
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
-- get_ltv_stats — LTV統計（過去の予約のみ）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ltv_stats(
  p_provider_id bigint
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

---------------------------------------------------------------
-- get_repeat_rate — リピート率（過去の予約のみ）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_repeat_rate(
  p_provider_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total bigint;
  v_repeat bigint;
BEGIN
  SELECT COUNT(DISTINCT customer_user_id) INTO v_total
  FROM bookings
  WHERE provider_id = p_provider_id
    AND status = 'confirmed'
    AND start_at <= now();

  SELECT COUNT(*) INTO v_repeat
  FROM (
    SELECT customer_user_id
    FROM bookings
    WHERE provider_id = p_provider_id
      AND status = 'confirmed'
      AND start_at <= now()
    GROUP BY customer_user_id
    HAVING COUNT(*) >= 2
  ) sub;

  RETURN json_build_object(
    'total_customers', v_total,
    'repeat_customers', v_repeat,
    'repeat_rate', CASE WHEN v_total > 0 THEN ROUND(v_repeat::numeric / v_total * 100, 1) ELSE 0 END
  );
END;
$$;

---------------------------------------------------------------
-- get_popular_menus — 人気メニュー（過去の予約のみ）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_popular_menus(
  p_provider_id bigint
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
  FROM services s
  LEFT JOIN bookings b ON b.service_id = s.id
    AND b.provider_id = p_provider_id
    AND b.status = 'confirmed'
    AND b.start_at <= now()
  WHERE s.provider_id = p_provider_id
  GROUP BY s.id, s.name
  ORDER BY COUNT(b.id) DESC
  LIMIT 10;
END;
$$;

---------------------------------------------------------------
-- get_booking_heatmap — 予約ヒートマップ（過去の予約のみ）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_booking_heatmap(
  p_provider_id bigint
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
    COUNT(*)
  FROM bookings b
  WHERE b.provider_id = p_provider_id
    AND b.status = 'confirmed'
    AND b.start_at <= now()
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;

---------------------------------------------------------------
-- get_monthly_avg_interval — 月別平均予約間隔（過去の予約のみ）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_monthly_avg_interval(
  p_provider_id bigint,
  p_months integer DEFAULT 24
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
  WITH months AS (
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

---------------------------------------------------------------
-- get_customer_averages — 全顧客平均KPI（過去の予約のみ）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_customer_averages(
  p_provider_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  WITH customer_stats AS (
    SELECT
      b.customer_user_id,
      COUNT(*) AS total_bookings,
      COALESCE(SUM(s.price), 0) AS total_revenue,
      CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(s.price), 0) / COUNT(*) ELSE 0 END AS avg_price,
      CASE WHEN COUNT(*) > 1
        THEN EXTRACT(DAY FROM MAX(b.start_at) - MIN(b.start_at)) / (COUNT(*) - 1)
        ELSE NULL
      END AS avg_interval_days
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
    GROUP BY b.customer_user_id
  )
  SELECT json_build_object(
    'avg_total_bookings', ROUND(COALESCE(AVG(total_bookings), 0), 1),
    'avg_total_revenue', ROUND(COALESCE(AVG(total_revenue), 0)),
    'avg_avg_price', ROUND(COALESCE(AVG(avg_price), 0)),
    'avg_interval_days', ROUND(COALESCE(AVG(avg_interval_days), 0)),
    'customer_count', COUNT(*)
  ) INTO v_result
  FROM customer_stats;

  RETURN v_result;
END;
$$;
