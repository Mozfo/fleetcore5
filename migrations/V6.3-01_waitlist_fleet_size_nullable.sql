-- V6.3-01: Make fleet_size nullable in crm_waitlist
-- V6.3: Simplified waitlist flow - fleet_size now collected via email survey
--
-- This migration makes fleet_size optional since users are registered
-- immediately when they select a non-operational country, without needing
-- to complete extra steps. The fleet size is now collected via a survey
-- link in the confirmation email.

-- Make fleet_size nullable
ALTER TABLE crm_waitlist
ALTER COLUMN fleet_size DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN crm_waitlist.fleet_size IS 'V6.3: Now optional - collected via email survey after initial registration';

