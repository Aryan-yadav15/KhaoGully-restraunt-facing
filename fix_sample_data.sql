-- ================================================================
-- FIX SAMPLE DATA - Query restaurant_owners first
-- ================================================================

-- Step 1: First, run this to see your actual restaurant_owner IDs
SELECT id, email, restaurant_name, restaurant_uid 
FROM restaurant_owners 
WHERE approval_status = 'approved'
ORDER BY id;

-- ================================================================
-- Step 2: Update the INSERT statements below with actual IDs
-- Replace the restaurant_id values with the actual IDs from Step 1
-- ================================================================

-- Example: If your query returns:
-- id=10, email='pizza@example.com', restaurant_name='Pizza Paradise'
-- id=11, email='burger@example.com', restaurant_name='Burger Junction'
-- Then use those IDs below

-- ================================================================
-- CORRECTED SAMPLE DATA
-- ================================================================

-- Delete existing sample data first (optional - only if rerunning)
-- DELETE FROM restaurant_order_transactions WHERE restaurant_id IN (1,4,5,6,7);
-- DELETE FROM restaurant_earnings_data WHERE restaurant_id IN (1,4,5,6,7);

-- ================================================================
-- INSERT STATEMENTS - Update restaurant_id values!
-- ================================================================

-- Pizza Paradise - Use actual ID from restaurant_owners table
INSERT INTO restaurant_earnings_data (
    restaurant_id, restaurant_name, restaurant_phone, restaurant_email,
    total_lifetime_earnings, total_completed_orders, commission_rate,
    total_commission_paid, has_bank_details,
    bank_account_number, bank_ifsc_code, bank_account_holder_name, upi_id,
    last_synced_at, data_sent_by, sync_status
) VALUES (
    4,  -- CHANGE THIS to actual restaurant_owners.id
    'Pizza Paradise', 
    '+91-9876543210', 
    'contact@pizzaparadise.com',
    24600.00,
    15,
    0.2000,
    6150.00,
    true,
    '1234567890123',
    'HDFC0001234',
    'Pizza Paradise Pvt Ltd',
    'pizzaparadise@paytm',
    NOW(),
    'admin@khaogully.com',
    'success'
)
ON CONFLICT (restaurant_id) DO UPDATE SET
    restaurant_name = EXCLUDED.restaurant_name,
    total_lifetime_earnings = EXCLUDED.total_lifetime_earnings,
    total_completed_orders = EXCLUDED.total_completed_orders,
    commission_rate = EXCLUDED.commission_rate,
    total_commission_paid = EXCLUDED.total_commission_paid,
    has_bank_details = EXCLUDED.has_bank_details,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_ifsc_code = EXCLUDED.bank_ifsc_code,
    bank_account_holder_name = EXCLUDED.bank_account_holder_name,
    upi_id = EXCLUDED.upi_id,
    last_synced_at = EXCLUDED.last_synced_at,
    data_sent_by = EXCLUDED.data_sent_by,
    sync_status = EXCLUDED.sync_status,
    updated_at = NOW();

-- Add more restaurants as needed...

-- ================================================================
-- ALTERNATIVE: Use dynamic query to match by restaurant_name
-- ================================================================

-- This approach automatically finds the correct IDs by matching names
-- Run this if restaurant names in restaurant_owners match your sample data

-- For Pizza Paradise
WITH owner_id AS (
    SELECT id FROM restaurant_owners 
    WHERE restaurant_name ILIKE '%Pizza Paradise%' 
    LIMIT 1
)
INSERT INTO restaurant_earnings_data (
    restaurant_id, restaurant_name, restaurant_phone, restaurant_email,
    total_lifetime_earnings, total_completed_orders, commission_rate,
    total_commission_paid, has_bank_details,
    bank_account_number, bank_ifsc_code, bank_account_holder_name, upi_id,
    last_synced_at, data_sent_by, sync_status
)
SELECT 
    owner_id.id,
    'Pizza Paradise', 
    '+91-9876543210', 
    'contact@pizzaparadise.com',
    24600.00,
    15,
    0.2000,
    6150.00,
    true,
    '1234567890123',
    'HDFC0001234',
    'Pizza Paradise Pvt Ltd',
    'pizzaparadise@paytm',
    NOW(),
    'admin@khaogully.com',
    'success'
FROM owner_id
WHERE EXISTS (SELECT 1 FROM owner_id)
ON CONFLICT (restaurant_id) DO UPDATE SET
    total_lifetime_earnings = EXCLUDED.total_lifetime_earnings,
    total_completed_orders = EXCLUDED.total_completed_orders,
    updated_at = NOW();
