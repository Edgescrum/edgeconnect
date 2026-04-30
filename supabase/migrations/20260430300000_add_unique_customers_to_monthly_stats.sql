-- get_monthly_stats に unique_customers カラムを追加
-- 顧客単価（総売上 / ユニーク顧客数）の計算に使用
----------------------------------------------------------------
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
  LEFT JOIN services s ON s.id = b.service_id
  GROUP BY mo.m, mo.month_start
  ORDER BY mo.month_start;
END;
$$;
