-- Add support for pending subscription status
-- This allows accounts to be created before payment is completed

-- Update the subscription_status column to include 'pending' as a valid value
-- Note: PostgreSQL doesn't have a built-in enum constraint, so we'll add a check constraint
ALTER TABLE "brokers" ADD CONSTRAINT "brokers_subscription_status_check" 
CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due', 'pending'));

-- Add comment to document the new status
COMMENT ON COLUMN brokers.subscription_status IS 'Subscription status: trial, active, cancelled, past_due, or pending (for pre-checkout accounts)'; 