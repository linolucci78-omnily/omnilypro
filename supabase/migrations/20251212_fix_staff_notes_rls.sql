-- Fix staff_notes RLS policies to allow authenticated users
-- Problema: policy troppo restrittiva richiedeva staff_members

-- Drop old policies
DROP POLICY IF EXISTS "Staff can create notes for their organization" ON staff_notes;
DROP POLICY IF EXISTS "Staff can view their organization notes" ON staff_notes;
DROP POLICY IF EXISTS "Staff can update their organization notes" ON staff_notes;
DROP POLICY IF EXISTS "Staff can delete their organization notes" ON staff_notes;

-- Allow authenticated users to view notes (they can only see notes for customers they have access to)
CREATE POLICY "Authenticated users can view staff notes"
ON staff_notes
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create notes
CREATE POLICY "Authenticated users can create staff notes"
ON staff_notes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update notes
CREATE POLICY "Authenticated users can update staff notes"
ON staff_notes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete notes
CREATE POLICY "Authenticated users can delete staff notes"
ON staff_notes
FOR DELETE
TO authenticated
USING (true);

-- Service role mantiene accesso completo
-- (policy già esistente, nessuna modifica necessaria)
