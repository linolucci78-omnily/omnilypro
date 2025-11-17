-- Grant table-level permissions to anon role
-- This is required IN ADDITION to RLS policies

-- Grant INSERT permission on contact_form_submissions to anon role
GRANT INSERT ON TABLE contact_form_submissions TO anon;

-- Also grant SELECT to allow the .select() to work after insert
GRANT SELECT ON TABLE contact_form_submissions TO anon;

-- Grant usage on the sequence (for auto-incrementing IDs if applicable)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify grants
SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'contact_form_submissions'
  AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY grantee, privilege_type;
