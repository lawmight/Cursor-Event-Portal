-- Create admin user for cal@neweraintelligence.com
-- This will create the user if they don't exist, or update their role to admin if they do

INSERT INTO users (id, email, name, role, created_at)
VALUES (
  uuid_generate_v4(),
  'cal@neweraintelligence.com',
  'Cal',
  'admin',
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin',
  name = COALESCE(EXCLUDED.name, users.name);

-- Verify the admin user was created/updated
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'cal@neweraintelligence.com';
