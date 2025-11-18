-- Fix estimate status check constraint to include all valid statuses

-- Drop existing check constraint
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS estimates_status_check;

-- Add new check constraint with proper estimate statuses
ALTER TABLE estimates ADD CONSTRAINT estimates_status_check
  CHECK (status IN ('draft', 'pending', 'sent', 'accepted', 'declined', 'expired'));

-- Update any invalid statuses to 'draft'
UPDATE estimates
SET status = 'draft'
WHERE status NOT IN ('draft', 'pending', 'sent', 'accepted', 'declined', 'expired');
