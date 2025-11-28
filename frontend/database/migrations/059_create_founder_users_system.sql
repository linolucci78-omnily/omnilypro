-- ============================================================================
-- FOUNDER USERS SYSTEM
-- Gestione utenti Founder con accesso illimitato al sistema OmnilyPro
-- ============================================================================

-- STEP 1: Create founder_users table
CREATE TABLE IF NOT EXISTS public.founder_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_at timestamp DEFAULT now() NOT NULL,
    granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    UNIQUE(user_id)
);

-- STEP 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_founder_users_user_id ON public.founder_users(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_users_is_active ON public.founder_users(is_active);
CREATE INDEX IF NOT EXISTS idx_founder_users_granted_by ON public.founder_users(granted_by);

-- STEP 3: Add comments for documentation
COMMENT ON TABLE public.founder_users IS 'Stores users with Founder status - highest level of access in OmnilyPro';
COMMENT ON COLUMN public.founder_users.user_id IS 'Reference to auth.users - the founder user';
COMMENT ON COLUMN public.founder_users.granted_at IS 'When founder status was granted';
COMMENT ON COLUMN public.founder_users.granted_by IS 'Who granted the founder status';
COMMENT ON COLUMN public.founder_users.is_active IS 'Whether founder status is currently active';
COMMENT ON COLUMN public.founder_users.notes IS 'Optional notes about this founder grant';

-- STEP 4: Create trigger for auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_founder_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_founder_users_updated_at_trigger ON public.founder_users;
CREATE TRIGGER update_founder_users_updated_at_trigger
    BEFORE UPDATE ON public.founder_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_founder_users_updated_at();

-- STEP 5: Enable RLS
ALTER TABLE public.founder_users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Drop existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'founder_users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.founder_users';
    END LOOP;
END $$;

-- STEP 7: Create RLS policies

-- Policy 1: Only super admins can view founders
CREATE POLICY "Super admins can view all founders"
ON public.founder_users
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.organization_users
    WHERE role = 'super_admin'
  )
  OR
  -- Founders can see themselves and other founders
  auth.uid() IN (
    SELECT user_id FROM public.founder_users
    WHERE is_active = true
  )
);

-- Policy 2: Only super admins can grant founder status
CREATE POLICY "Super admins can grant founder status"
ON public.founder_users
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy 3: Only super admins can update founder status
CREATE POLICY "Super admins can update founder status"
ON public.founder_users
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.organization_users
    WHERE role = 'super_admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy 4: Only super admins can delete founder status (soft delete preferred via is_active)
CREATE POLICY "Super admins can revoke founder status"
ON public.founder_users
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.organization_users
    WHERE role = 'super_admin'
  )
);

-- STEP 8: Create helper function to check if user is founder
CREATE OR REPLACE FUNCTION public.is_founder(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.founder_users
    WHERE user_id = check_user_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Create audit log trigger for founder changes
CREATE OR REPLACE FUNCTION public.log_founder_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_text text;
  old_status boolean;
  new_status boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_text := 'Founder status granted';
    INSERT INTO public.audit_logs (
      user_id,
      org_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address
    ) VALUES (
      NEW.granted_by,
      NULL, -- Founders are system-wide, not org-specific
      action_text,
      'founder_users',
      NEW.id::text,
      jsonb_build_object(
        'founder_user_id', NEW.user_id,
        'is_active', NEW.is_active
      ),
      inet_client_addr()::text
    );
  ELSIF TG_OP = 'UPDATE' THEN
    old_status := OLD.is_active;
    new_status := NEW.is_active;

    IF old_status != new_status THEN
      IF new_status THEN
        action_text := 'Founder status activated';
      ELSE
        action_text := 'Founder status deactivated';
      END IF;

      INSERT INTO public.audit_logs (
        user_id,
        org_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address
      ) VALUES (
        auth.uid(),
        NULL,
        action_text,
        'founder_users',
        NEW.id::text,
        jsonb_build_object(
          'founder_user_id', NEW.user_id,
          'old_status', old_status,
          'new_status', new_status
        ),
        inet_client_addr()::text
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_text := 'Founder status revoked';
    INSERT INTO public.audit_logs (
      user_id,
      org_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address
    ) VALUES (
      auth.uid(),
      NULL,
      action_text,
      'founder_users',
      OLD.id::text,
      jsonb_build_object(
        'founder_user_id', OLD.user_id
      ),
      inet_client_addr()::text
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_founder_changes_trigger ON public.founder_users;
CREATE TRIGGER log_founder_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.founder_users
    FOR EACH ROW
    EXECUTE FUNCTION public.log_founder_changes();

-- ============================================================================
-- STEP 10: VERIFICATION QUERIES
-- ============================================================================

-- Check table exists
SELECT
  'founder_users table created' as status,
  COUNT(*) as founder_count
FROM public.founder_users;

-- Check RLS is enabled
SELECT
  'RLS enabled on founder_users:' as status,
  relrowsecurity as enabled
FROM pg_class
WHERE relname = 'founder_users';

-- List all policies
SELECT
  'Founder users policies:' as info,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'founder_users'
ORDER BY policyname;
