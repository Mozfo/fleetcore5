-- V6.4-2: Add GeoIP detection columns to crm_leads
-- Same pattern as crm_waitlist for spam detection
--
-- detected_country_code: Country detected by GeoIP (to compare with user-selected country_code)
-- ip_address: Client IP address for pattern detection

-- 1. Add detected_country_code column
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS detected_country_code VARCHAR(2);

-- 2. Add ip_address column (separate from consent_ip which is GDPR-specific)
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

-- 3. Add index for spam pattern detection (same IP, multiple leads)
CREATE INDEX IF NOT EXISTS idx_crm_leads_ip_address
ON crm_leads(ip_address)
WHERE ip_address IS NOT NULL AND deleted_at IS NULL;

-- 4. Add index for country mismatch detection
CREATE INDEX IF NOT EXISTS idx_crm_leads_detected_country
ON crm_leads(detected_country_code)
WHERE detected_country_code IS NOT NULL AND deleted_at IS NULL;

-- 5. Comments
COMMENT ON COLUMN crm_leads.detected_country_code IS 'Country code detected by GeoIP. Compare with country_code to detect VPN/fraud.';
COMMENT ON COLUMN crm_leads.ip_address IS 'Client IP address for spam pattern detection. Separate from consent_ip (GDPR).';
