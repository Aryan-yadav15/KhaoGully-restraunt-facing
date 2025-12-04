-- ================================================================
-- FIX EARNINGS TABLES TO USE UUID
-- This script alters the restaurant_id column type from INTEGER to UUID
-- ================================================================

-- Step 1: Drop foreign key constraint first
ALTER TABLE restaurant_order_transactions 
    DROP CONSTRAINT IF EXISTS fk_restaurant_earnings;

-- Step 2: Alter restaurant_earnings_data table
ALTER TABLE restaurant_earnings_data 
    ALTER COLUMN restaurant_id TYPE UUID USING restaurant_id::text::uuid;

-- Step 3: Alter restaurant_order_transactions table
ALTER TABLE restaurant_order_transactions 
    ALTER COLUMN restaurant_id TYPE UUID USING restaurant_id::text::uuid;

-- Step 4: Re-add the foreign key constraint
ALTER TABLE restaurant_order_transactions 
    ADD CONSTRAINT fk_restaurant_earnings 
    FOREIGN KEY (restaurant_id) 
    REFERENCES restaurant_earnings_data(restaurant_id) 
    ON DELETE CASCADE;

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('restaurant_earnings_data', 'restaurant_order_transactions') 
    AND column_name = 'restaurant_id';
