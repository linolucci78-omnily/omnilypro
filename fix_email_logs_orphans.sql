-- Step 1: Find and fix orphaned records (set organization_id to NULL for non-existent organizations)
UPDATE email_logs
SET organization_id = NULL
WHERE organization_id IS NOT NULL
  AND organization_id NOT IN (SELECT id FROM organizations);

-- Step 2: Now add the foreign key constraint
ALTER TABLE email_logs
ADD CONSTRAINT fk_email_logs_organization
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE SET NULL;

-- Step 3: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_organization_id
ON email_logs(organization_id);

-- Step 4: Refresh the schema cache
NOTIFY pgrst, 'reload schema';
