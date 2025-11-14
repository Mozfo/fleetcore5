-- Migration: Add preferred_locale to adm_provider_employees
-- Date: 2025-11-13
-- Purpose: Support employee locale preferences for notification system CASCADE 2

-- Add preferred_locale column
ALTER TABLE adm_provider_employees
ADD COLUMN preferred_locale VARCHAR(10);

-- Add column comment
COMMENT ON COLUMN adm_provider_employees.preferred_locale IS
'Employee preferred locale for UI and notifications (e.g., "en", "fr", "ar"). Used in CASCADE 2 when employee has no tenant context.';

-- Verification query
-- SELECT id, email, preferred_locale FROM adm_provider_employees LIMIT 5;
