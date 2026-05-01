-- Remove customer_custom_labels column from provider_settings
-- This feature was moved out of the schedule page and is no longer used.
ALTER TABLE provider_settings DROP COLUMN IF EXISTS customer_custom_labels;
