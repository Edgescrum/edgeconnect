-- Benchmark improvements:
-- 1. get_category_benchmark: add avg_unit_price to output
-- 2. get_category_survey_benchmark: new RPC for survey benchmark with drivers

---------------------------------------------------------------
-- 1. get_category_benchmark - add avg_unit_price
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
  v_avg_interval numeric;
  v_avg_unit_price numeric;
BEGIN
  -- Count active providers in category
  SELECT COUNT(*) INTO v_provider_count
  FROM providers
  WHERE category = p_category AND is_active = true;

  IF v_provider_count < 5 THEN
    RETURN json_build_object('available', false, 'provider_count', v_provider_count);
  END IF;

  -- Monthly average bookings + revenue (current month)
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

  -- Average booking interval (days between consecutive bookings per customer, averaged across providers)
  WITH customer_intervals AS (
    SELECT
      b.provider_id,
      b.customer_user_id,
      AVG(EXTRACT(EPOCH FROM (b.start_at - LAG(b.start_at) OVER (
        PARTITION BY b.provider_id, b.customer_user_id ORDER BY b.start_at
      ))) / 86400.0) AS avg_days
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    WHERE p.category = p_category AND p.is_active = true
      AND b.status = 'confirmed'
    GROUP BY b.provider_id, b.customer_user_id
    HAVING COUNT(*) >= 2
  ),
  provider_avg_interval AS (
    SELECT provider_id, AVG(avg_days) AS provider_avg
    FROM customer_intervals
    WHERE avg_days IS NOT NULL AND avg_days > 0
    GROUP BY provider_id
  )
  SELECT COALESCE(AVG(provider_avg), 0)
  INTO v_avg_interval
  FROM provider_avg_interval;

  -- Average unit price (revenue / unique customers per provider, then averaged)
  WITH provider_unit_price AS (
    SELECT
      b.provider_id,
      CASE WHEN COUNT(DISTINCT b.customer_user_id) > 0
        THEN SUM(s.price)::numeric / COUNT(DISTINCT b.customer_user_id)
        ELSE 0
      END AS unit_price
    FROM bookings b
    JOIN providers p ON p.id = b.provider_id
    JOIN services s ON s.id = b.service_id
    WHERE p.category = p_category AND p.is_active = true
      AND b.status = 'confirmed'
      AND b.start_at >= date_trunc('month', now())
    GROUP BY b.provider_id
  )
  SELECT COALESCE(AVG(unit_price), 0)
  INTO v_avg_unit_price
  FROM provider_unit_price;

  RETURN json_build_object(
    'available', true,
    'provider_count', v_provider_count,
    'avg_monthly_bookings', ROUND(v_avg_bookings, 1),
    'avg_monthly_revenue', ROUND(v_avg_revenue),
    'avg_booking_interval', CASE WHEN v_avg_interval > 0 THEN ROUND(v_avg_interval, 1) ELSE NULL END,
    'avg_unit_price', ROUND(v_avg_unit_price)
  );
END;
$$;

---------------------------------------------------------------
-- 2. get_category_survey_benchmark - survey benchmark with drivers
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_category_survey_benchmark(
  p_category text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_count bigint;
  v_avg_csat numeric;
  v_avg_response_rate numeric;
  v_avg_driver_service numeric;
  v_avg_driver_quality numeric;
  v_avg_driver_price numeric;
  v_total_responses bigint;
  v_total_notifications bigint;
BEGIN
  -- Count active providers in category
  SELECT COUNT(*) INTO v_provider_count
  FROM providers
  WHERE category = p_category AND is_active = true;

  IF v_provider_count < 5 THEN
    RETURN json_build_object('available', false, 'provider_count', v_provider_count);
  END IF;

  -- Get all provider IDs in category
  -- Average CSAT + driver scores across all responses in category
  SELECT
    COALESCE(AVG(sr.csat), 0),
    COALESCE(AVG(sr.driver_service), 0),
    COALESCE(AVG(sr.driver_quality), 0),
    COALESCE(AVG(sr.driver_price), 0),
    COUNT(*)
  INTO v_avg_csat, v_avg_driver_service, v_avg_driver_quality, v_avg_driver_price, v_total_responses
  FROM survey_responses sr
  JOIN providers p ON p.id = sr.provider_id
  WHERE p.category = p_category AND p.is_active = true;

  -- Average response rate: total responses / total sent notifications
  SELECT COUNT(*) INTO v_total_notifications
  FROM pending_survey_notifications psn
  JOIN providers p ON p.id = psn.provider_id
  WHERE p.category = p_category AND p.is_active = true
    AND psn.status = 'sent';

  IF v_total_notifications > 0 THEN
    v_avg_response_rate := LEAST(100, ROUND(v_total_responses::numeric / v_total_notifications * 100, 1));
  ELSE
    v_avg_response_rate := 0;
  END IF;

  IF v_total_responses = 0 THEN
    RETURN json_build_object('available', false, 'provider_count', v_provider_count);
  END IF;

  RETURN json_build_object(
    'available', true,
    'provider_count', v_provider_count,
    'avg_csat', ROUND(v_avg_csat, 1),
    'avg_response_rate', v_avg_response_rate,
    'avg_driver_service', ROUND(v_avg_driver_service, 1),
    'avg_driver_quality', ROUND(v_avg_driver_quality, 1),
    'avg_driver_price', ROUND(v_avg_driver_price, 1)
  );
END;
$$;
