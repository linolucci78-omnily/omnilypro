-- Enable Realtime for customers table
-- This allows the customer PWA to receive live updates when points are added

-- Enable realtime for customers table
ALTER PUBLICATION supabase_realtime ADD TABLE customers;

-- Verify it's enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'customers';
