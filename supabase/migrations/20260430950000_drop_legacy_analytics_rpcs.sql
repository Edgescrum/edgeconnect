-- Drop legacy analytics RPCs (p_segment versions) now that all callers use _filtered versions
-- Also drop get_segment_customer_ids which is no longer needed

-- Legacy RPCs with p_segment parameter
DROP FUNCTION IF EXISTS get_monthly_stats(bigint, integer, text);
DROP FUNCTION IF EXISTS get_avg_booking_interval(bigint, text);
DROP FUNCTION IF EXISTS get_monthly_avg_interval(bigint, integer, text);
DROP FUNCTION IF EXISTS get_popular_menus(bigint, text);
DROP FUNCTION IF EXISTS get_booking_heatmap(bigint, text);

-- Legacy RPCs without segment (simple versions)
DROP FUNCTION IF EXISTS get_monthly_stats(bigint, integer);
DROP FUNCTION IF EXISTS get_avg_booking_interval(bigint);
DROP FUNCTION IF EXISTS get_monthly_avg_interval(bigint, integer);
DROP FUNCTION IF EXISTS get_popular_menus(bigint);
DROP FUNCTION IF EXISTS get_booking_heatmap(bigint);
DROP FUNCTION IF EXISTS get_ltv_stats(bigint);
DROP FUNCTION IF EXISTS get_repeat_rate(bigint);

-- Helper function no longer needed
DROP FUNCTION IF EXISTS get_segment_customer_ids(bigint, text);
