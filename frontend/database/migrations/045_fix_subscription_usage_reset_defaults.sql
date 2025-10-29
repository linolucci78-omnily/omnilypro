-- Migration: Fix subscription usage reset defaults
-- Description: Change last_usage_reset_at and last_weekly_reset_at defaults from NOW() to NULL
--              This ensures that on first validation, the reset always happens and usage counters start fresh
-- Date: 2025-10-29

-- Change default for last_usage_reset_at from NOW() to NULL
ALTER TABLE customer_subscriptions
  ALTER COLUMN last_usage_reset_at SET DEFAULT NULL;

-- Change default for last_weekly_reset_at from NOW() to NULL
ALTER TABLE customer_subscriptions
  ALTER COLUMN last_weekly_reset_at SET DEFAULT NULL;

-- Update existing subscriptions with 0 usage_count to have NULL reset timestamps
-- This fixes subscriptions that were just created but never used
UPDATE customer_subscriptions
SET
  last_usage_reset_at = NULL,
  last_weekly_reset_at = NULL
WHERE usage_count = 0
  AND (last_usage_reset_at IS NOT NULL OR last_weekly_reset_at IS NOT NULL);
