-- Add push notification token columns to restaurant_owners table
-- This allows storing Expo push tokens for sending notifications

ALTER TABLE restaurant_owners
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP;

-- Create index for faster lookups by push token
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_push_token 
ON restaurant_owners(push_token);

-- Add comment to columns
COMMENT ON COLUMN restaurant_owners.push_token IS 'Expo push notification token (format: ExponentPushToken[...])';
COMMENT ON COLUMN restaurant_owners.push_token_updated_at IS 'Timestamp when push token was last updated';
