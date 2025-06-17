-- Add role field to users table for admin functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for role lookup
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Fix the column naming mismatch in sync functions
-- Update sync-top-shows function to use correct column names
-- setlist_songs uses 'position' not 'order_index'

-- Grant permissions for admin users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_user_admin TO authenticated;

-- Set a default admin user (you can change this email to your own)
-- This will help with initial setup
UPDATE users SET role = 'admin' WHERE email ILIKE '%@%' LIMIT 1;