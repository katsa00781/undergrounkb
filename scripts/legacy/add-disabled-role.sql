-- Add 'disabled' value to user_role enum type
-- This allows users to be marked as disabled instead of deleted

-- First, let's add the new enum value
ALTER TYPE user_role ADD VALUE 'disabled';

-- Optional: Add a comment to document this change
COMMENT ON TYPE user_role IS 'User roles: admin, user, disabled (soft deleted)';

-- Verify the change
SELECT unnest(enum_range(NULL::user_role)) AS role_values;
