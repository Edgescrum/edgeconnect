-- Analytics performance: add indexes for customer-centric RPC queries
-- (provider_id, start_at, status) already exists as idx_bookings_provider_start_status

-- For get_repeat_rate / get_ltv_stats: GROUP BY customer_user_id with provider_id + status filter
CREATE INDEX IF NOT EXISTS idx_bookings_provider_status_customer
  ON public.bookings USING btree (provider_id, status, customer_user_id);

-- For get_booking_heatmap: provider_id + status filter, then extract from start_at
-- Covered by idx_bookings_provider_start_status, but a partial index on confirmed only is more efficient
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_provider_start
  ON public.bookings USING btree (provider_id, start_at)
  WHERE status = 'confirmed';
