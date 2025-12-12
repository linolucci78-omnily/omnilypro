-- Find sales from December 12, 2025 in customer_activities
SELECT
  COUNT(*) as count,
  MAX(created_at) as last_sale,
  MIN(created_at) as first_sale
FROM customer_activities
WHERE DATE(created_at AT TIME ZONE 'Europe/Rome') = '2025-12-12'
  AND organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
  AND type = 'transaction';

-- Show all activities from today
SELECT
  id,
  customer_id,
  type,
  monetary_value,
  points_earned,
  activity_description,
  created_at AT TIME ZONE 'Europe/Rome' as rome_time
FROM customer_activities
WHERE DATE(created_at AT TIME ZONE 'Europe/Rome') = '2025-12-12'
  AND organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
ORDER BY created_at DESC
LIMIT 20;
