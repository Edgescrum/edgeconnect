-- 分析ページRPCパフォーマンス改善
-- Critical 1: get_monthly_avg_interval のクロスジョイン排除（LAGベース）
-- Critical 2: get_segment_customer_ids の5回重複実行排除（Server Action側で対応）
--             → 各RPCに p_customer_ids パラメータを追加
-- Major 3: get_customers の相関サブクエリ排除（DISTINCT ON）
-- Major 4: get_category_benchmark の3回スキャン統合（2回に削減）
-- Minor 5: get_repeat_rate の2回スキャン統合

---------------------------------------------------------------
-- インデックス追加
---------------------------------------------------------------

-- セグメントフィルター用カバリングインデックス
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_provider_customer
  ON public.bookings (provider_id, customer_user_id, start_at)
  WHERE status = 'confirmed';

-- ベンチマーク用
CREATE INDEX IF NOT EXISTS idx_providers_category_active
  ON public.providers (category, is_active) WHERE is_active = true;

---------------------------------------------------------------
-- Critical 1: get_monthly_avg_interval — LAGベースに書き換え
-- セグメントフィルター版（p_segment パラメータ維持）
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
  booking_pairs AS (
    SELECT
      b.customer_user_id,
      b.start_at,
      to_char(date_trunc('month', b.start_at), 'YYYY-MM') AS booking_month,
      EXTRACT(DAY FROM b.start_at - LAG(b.start_at) OVER (
        PARTITION BY b.customer_user_id ORDER BY b.start_at
      )) AS interval_days
    FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
      AND (p_segment IS NULL OR p_segment = '' OR p_segment = 'all'
           OR b.customer_user_id IN (SELECT cuid FROM segment_customers))
  )
  SELECT
    mo.m,
    ROUND(COALESCE(AVG(bp.interval_days) FILTER (WHERE bp.interval_days IS NOT NULL), 0), 1)
  FROM months mo
  LEFT JOIN booking_pairs bp ON bp.booking_month = mo.m
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;

---------------------------------------------------------------
-- Critical 2: 各RPCに p_customer_ids パラメータ追加版を作成
-- Server Action側で get_segment_customer_ids を1回だけ呼び、
-- 結果のIDリストを各RPCに渡す
---------------------------------------------------------------

-- get_monthly_stats with p_customer_ids
CREATE OR REPLACE FUNCTION public.get_monthly_stats_filtered(
  p_provider_id bigint,
  p_months integer DEFAULT 6,
  p_customer_ids bigint[] DEFAULT NULL
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
    AND (p_customer_ids IS NULL OR b.customer_user_id = ANY(p_customer_ids))
  LEFT JOIN services s ON s.id = b.service_id
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;

-- get_monthly_avg_interval with p_customer_ids (LAGベース)
CREATE OR REPLACE FUNCTION public.get_monthly_avg_interval_filtered(
  p_provider_id bigint,
  p_months integer DEFAULT 24,
  p_customer_ids bigint[] DEFAULT NULL
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
  booking_pairs AS (
    SELECT
      b.customer_user_id,
      b.start_at,
      to_char(date_trunc('month', b.start_at), 'YYYY-MM') AS booking_month,
      EXTRACT(DAY FROM b.start_at - LAG(b.start_at) OVER (
        PARTITION BY b.customer_user_id ORDER BY b.start_at
      )) AS interval_days
    FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
      AND (p_customer_ids IS NULL OR b.customer_user_id = ANY(p_customer_ids))
  )
  SELECT
    mo.m,
    ROUND(COALESCE(AVG(bp.interval_days) FILTER (WHERE bp.interval_days IS NOT NULL), 0), 1)
  FROM months mo
  LEFT JOIN booking_pairs bp ON bp.booking_month = mo.m
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;

-- get_avg_booking_interval with p_customer_ids
CREATE OR REPLACE FUNCTION public.get_avg_booking_interval_filtered(
  p_provider_id bigint,
  p_customer_ids bigint[] DEFAULT NULL
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

-- get_popular_menus with p_customer_ids
CREATE OR REPLACE FUNCTION public.get_popular_menus_filtered(
  p_provider_id bigint,
  p_customer_ids bigint[] DEFAULT NULL
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
  GROUP BY s.id, s.name
  ORDER BY COUNT(b.id) DESC
  LIMIT 10;
END;
$$;

-- get_booking_heatmap with p_customer_ids
CREATE OR REPLACE FUNCTION public.get_booking_heatmap_filtered(
  p_provider_id bigint,
  p_customer_ids bigint[] DEFAULT NULL
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
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;

---------------------------------------------------------------
-- Major 3: get_customers — 相関サブクエリを DISTINCT ON に書き換え
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
      EXTRACT(DAY FROM now() - MAX(b.start_at))::integer AS days_since
    FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
    GROUP BY b.customer_user_id
  ),
  last_bookings AS (
    SELECT DISTINCT ON (b.customer_user_id)
      b.customer_user_id AS cuid,
      s.name AS last_menu
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE b.provider_id = p_provider_id
      AND b.status = 'confirmed'
      AND b.start_at <= now()
    ORDER BY b.customer_user_id, b.start_at DESC
  )
  SELECT
    cs.cuid,
    u.display_name,
    u.customer_name,
    cs.bcount,
    cs.last_visit,
    lb.last_menu,
    cs.days_since
  FROM customer_stats cs
  JOIN users u ON u.id = cs.cuid
  LEFT JOIN last_bookings lb ON lb.cuid = cs.cuid
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
-- Major 4: get_category_benchmark — 3回スキャンを2回に統合
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

  -- 月間平均予約数 + 月間平均売上を1クエリに統合
  WITH provider_monthly AS (
    SELECT
      b.provider_id,
      COUNT(*) AS monthly_count,
      COALESCE(SUM(s.price), 0) AS monthly_rev
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    JOIN services s ON s.id = b.service_id
    WHERE p.category = p_category AND p.is_active = true
      AND b.status = 'confirmed'
      AND b.start_at >= date_trunc('month', now())
    GROUP BY b.provider_id
  )
  SELECT COALESCE(AVG(monthly_count), 0), COALESCE(AVG(monthly_rev), 0)
  INTO v_avg_bookings, v_avg_revenue
  FROM provider_monthly;

  -- 平均リピート率（全期間対象なので別クエリのまま）
  WITH provider_repeat AS (
    SELECT
      b.provider_id,
      COUNT(DISTINCT b.customer_user_id) AS total_custs,
      COUNT(DISTINCT b.customer_user_id) FILTER (
        WHERE b.customer_user_id IN (
          SELECT b2.customer_user_id
          FROM bookings b2
          WHERE b2.provider_id = b.provider_id AND b2.status = 'confirmed'
          GROUP BY b2.customer_user_id
          HAVING COUNT(*) >= 2
        )
      ) AS repeat_custs
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    WHERE p.category = p_category AND p.is_active = true AND b.status = 'confirmed'
    GROUP BY b.provider_id
  )
  SELECT COALESCE(AVG(
    CASE WHEN total_custs > 0
      THEN repeat_custs::numeric / total_custs * 100
      ELSE 0
    END
  ), 0) INTO v_avg_repeat_rate
  FROM provider_repeat;

  RETURN json_build_object(
    'available', true,
    'provider_count', v_provider_count,
    'avg_monthly_bookings', ROUND(v_avg_bookings, 1),
    'avg_monthly_revenue', ROUND(v_avg_revenue),
    'avg_repeat_rate', ROUND(v_avg_repeat_rate, 1)
  );
END;
$$;

---------------------------------------------------------------
-- Minor 5: get_repeat_rate — 2回スキャンを1回に統合
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
  WITH customer_counts AS (
    SELECT customer_user_id, COUNT(*) AS cnt
    FROM bookings
    WHERE provider_id = p_provider_id
      AND status = 'confirmed'
      AND start_at <= now()
    GROUP BY customer_user_id
  )
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE cnt >= 2)
  INTO v_total, v_repeat
  FROM customer_counts;

  RETURN json_build_object(
    'total_customers', v_total,
    'repeat_customers', v_repeat,
    'repeat_rate', CASE WHEN v_total > 0 THEN ROUND(v_repeat::numeric / v_total * 100, 1) ELSE 0 END
  );
END;
$$;
