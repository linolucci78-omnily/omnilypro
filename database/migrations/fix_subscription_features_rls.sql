-- Fix RLS policies for subscription_features table
-- Questo file deve essere eseguito su Supabase SQL Editor

-- 1. Rimuovi la policy esistente che causa problemi
DROP POLICY IF EXISTS "Super admins can manage all subscription features" ON public.subscription_features;

-- 2. Crea policy separata per SELECT
CREATE POLICY "Users can view their organization subscription features"
  ON public.subscription_features FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 3. Crea policy per INSERT (solo super admin)
CREATE POLICY "Super admins can insert subscription features"
  ON public.subscription_features FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 4. Crea policy per UPDATE (solo super admin)
CREATE POLICY "Super admins can update subscription features"
  ON public.subscription_features FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 5. Crea policy per DELETE (solo super admin)
CREATE POLICY "Super admins can delete subscription features"
  ON public.subscription_features FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 6. Verifica che RLS sia abilitato
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;

-- 7. Verifica le policy create
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscription_features';
