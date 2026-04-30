-- get_monthly_avg_interval: 月別の平均予約間隔を計算するRPC
-- 各月において、その月末時点でのリピーター顧客の平均予約間隔を算出する
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
  -- 各月末時点での顧客ごとの平均予約間隔を計算
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
