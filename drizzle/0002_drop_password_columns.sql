-- Migration: Drop plaintext password columns from user_settings
-- Date: 2026-02-13
-- Reason: Credentials are now stored securely in iOS Keychain via SecureCredentialsService

-- Drop plaintext password columns
ALTER TABLE "user_settings" 
DROP COLUMN IF EXISTS "libre_password",
DROP COLUMN IF EXISTS "dexcom_password";

-- Drop username columns as well (stored in Keychain)
ALTER TABLE "user_settings" 
DROP COLUMN IF EXISTS "libre_username",
DROP COLUMN IF EXISTS "dexcom_username";

-- Note: Dexcom region might still be needed for API calls, keeping it for now
-- If dexcom_region was stored, evaluate if needed server-side

-- Add comment to document the change
COMMENT ON TABLE "user_settings" IS 'User settings - Credentials removed (now in iOS Keychain)';
