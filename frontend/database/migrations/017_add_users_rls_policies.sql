-- RLS Policies for users table (Admin OMNILY PRO)

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own record
CREATE POLICY "Users can read own record"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Super admins can read all users
CREATE POLICY "Super admins can read all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
    AND users.status = 'active'
  )
);

-- Policy: Super admins can insert users
CREATE POLICY "Super admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
    AND users.status = 'active'
  )
);

-- Policy: Super admins can update users
CREATE POLICY "Super admins can update users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
    AND users.status = 'active'
  )
);

-- Policy: Super admins can delete users
CREATE POLICY "Super admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
    AND users.status = 'active'
  )
);
