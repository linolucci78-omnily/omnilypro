-- Migration: Add Admin User Profile Fields
-- Description: Adds first_name, last_name, avatar_url, and phone to users table for admin profile management
-- Date: 2024-11-25

-- 1. Add profile fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. Create storage bucket for admin avatars (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-avatars', 'admin-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for admin avatars

-- Allow authenticated users to read all admin avatars
CREATE POLICY "Anyone can view admin avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'admin-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'admin-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'admin-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create index on avatar_url for faster queries
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON public.users(avatar_url);

-- 5. Add comment to table
COMMENT ON COLUMN public.users.first_name IS 'User first name for profile display';
COMMENT ON COLUMN public.users.last_name IS 'User last name for profile display';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user profile picture in admin-avatars bucket';
COMMENT ON COLUMN public.users.phone IS 'User phone number for contact';
