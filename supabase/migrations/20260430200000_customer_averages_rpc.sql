-- 全顧客の平均KPI値を算出するRPC（顧客詳細ページで個別顧客との比較に使用）
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
