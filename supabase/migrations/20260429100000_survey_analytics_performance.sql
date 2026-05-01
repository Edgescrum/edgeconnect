-- Survey analytics performance improvements
-- 1. Index on survey_responses (provider_id, created_at)
-- 2. RPC: get_all_customer_segments - returns all customer segments in one call

---------------------------------------------------------------
-- Index for survey_responses lookup performance
---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_survey_responses_provider_created
ON survey_responses (provider_id, created_at);

---------------------------------------------------------------
-- get_all_customer_segments: returns segment for all customers in one call
-- Replaces 4x calls to get_segment_customer_ids
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_all_customer_segments(
  p_provider_id bigint
)
RETURNS TABLE (customer_user_id bigint, segment text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
  SELECT
    cd.cuid AS customer_user_id,
    CASE
      WHEN cd.visit_count >= 5 AND (cd.avg_interval IS NULL OR cd.days_since_last < cd.avg_interval * 1.5)
        THEN 'excellent'
      WHEN cd.visit_count >= 2 AND cd.visit_count < 5 AND (cd.avg_interval IS NULL OR cd.days_since_last < cd.avg_interval * 1.5)
        THEN 'normal'
      WHEN cd.avg_interval IS NOT NULL AND cd.days_since_last >= cd.avg_interval * 1.5 AND cd.days_since_last < cd.avg_interval * 3
        THEN 'dormant'
      WHEN cd.visit_count = 1 OR (cd.avg_interval IS NOT NULL AND cd.days_since_last >= cd.avg_interval * 3)
        THEN 'at_risk'
      ELSE 'normal'
    END AS segment
  FROM customer_data cd;
END;
$$;
