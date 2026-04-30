-- Sprint 4 CU-2: 顧客データ集計RPC + AN-1: 分析データ集計RPC

---------------------------------------------------------------
-- CU-2: get_customers — 顧客一覧（検索・フィルタ対応）
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_customers(
  p_provider_id bigint,
  p_query text DEFAULT NULL,
  p_filter text DEFAULT 'all' -- 'all' | '1month' | '3months'
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
        ORDER BY b2.start_at DESC LIMIT 1
      )) AS last_menu,
      EXTRACT(DAY FROM now() - MAX(b.start_at))::integer AS days_since
    FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
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
    -- 名前検索
    (p_query IS NULL OR p_query = '' OR
     u.display_name ILIKE '%' || p_query || '%' OR
     u.customer_name ILIKE '%' || p_query || '%')
    -- 来店頻度フィルタ
    AND (
      p_filter = 'all'
      OR (p_filter = '1month' AND cs.days_since >= 30)
      OR (p_filter = '3months' AND cs.days_since >= 90)
    )
  ORDER BY cs.last_visit DESC NULLS LAST;
END;
$$;

---------------------------------------------------------------
-- CU-2: get_customer_detail — 顧客詳細（予約履歴・KPI集計）
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
  -- ユーザー情報
  SELECT id, display_name, customer_name, customer_phone, created_at
  INTO v_user
  FROM users WHERE id = p_customer_user_id;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- 予約統計
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
    AND b.status = 'confirmed';

  -- 離脱リスク計算
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
    'days_since_last_visit', EXTRACT(DAY FROM now() - v_stats.last_visit)::integer
  );

  RETURN v_result;
END;
$$;

---------------------------------------------------------------
-- CU-2: get_customer_monthly_visits — 月別来店数（過去6ヶ月）
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
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;

---------------------------------------------------------------
-- AN-1: get_monthly_stats — 月間予約数・売上・キャンセル率
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
  cancel_rate numeric
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
    END
  FROM months mo
  LEFT JOIN bookings b ON b.provider_id = p_provider_id
    AND b.start_at >= mo.month_start
    AND b.start_at < mo.month_end
  LEFT JOIN services s ON s.id = b.service_id
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;

---------------------------------------------------------------
-- AN-1: get_popular_menus — メニュー別予約数ランキング
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
  WHERE s.provider_id = p_provider_id
  GROUP BY s.id, s.name
  ORDER BY COUNT(b.id) DESC
  LIMIT 10;
END;
$$;

---------------------------------------------------------------
-- AN-1: get_booking_heatmap — 曜日x時間帯の予約数
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
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;

---------------------------------------------------------------
-- AN-1: get_repeat_rate — リピート率（2回以上来店の顧客割合）
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
  WHERE provider_id = p_provider_id AND status = 'confirmed';

  SELECT COUNT(*) INTO v_repeat
  FROM (
    SELECT customer_user_id
    FROM bookings
    WHERE provider_id = p_provider_id AND status = 'confirmed'
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
-- AN-1: get_ltv_stats — 平均LTV・顧客セグメント分布
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
  -- 顧客セグメント: LTVと来店間隔で分類
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
    WHERE b.provider_id = p_provider_id AND b.status = 'confirmed'
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
-- AN-1: get_category_benchmark — 同カテゴリ平均
---------------------------------------------------------------
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
  v_avg_repeat_rate numeric;
BEGIN
  -- 同カテゴリの事業主数チェック（最低5で有効）
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

  -- 平均リピート率
  WITH provider_repeat AS (
    SELECT
      b.provider_id,
      CASE WHEN COUNT(DISTINCT b.customer_user_id) > 0
        THEN (SELECT COUNT(*) FROM (
          SELECT customer_user_id FROM bookings
          WHERE provider_id = b.provider_id AND status = 'confirmed'
          GROUP BY customer_user_id HAVING COUNT(*) >= 2
        ) r)::numeric / COUNT(DISTINCT b.customer_user_id) * 100
        ELSE 0
      END AS repeat_rate
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    WHERE p.category = p_category AND p.is_active = true AND b.status = 'confirmed'
    GROUP BY b.provider_id
  )
  SELECT COALESCE(AVG(repeat_rate), 0) INTO v_avg_repeat_rate FROM provider_repeat;

  RETURN json_build_object(
    'available', true,
    'provider_count', v_provider_count,
    'avg_monthly_bookings', ROUND(v_avg_bookings, 1),
    'avg_monthly_revenue', ROUND(v_avg_revenue),
    'avg_repeat_rate', ROUND(v_avg_repeat_rate, 1)
  );
END;
$$;
