# Earnings Data Issue Fix Guide

## Problem
The `/orders` endpoint and earnings data are not showing because there's a **mismatch between `restaurant_id` values** in your sample data and the actual `id` values in the `restaurant_owners` table.

### How the System Works
1. User logs in → gets their `id` from `restaurant_owners` table (Database B)
2. Backend queries `restaurant_earnings_data` WHERE `restaurant_id` = user's `id`
3. Your sample data uses arbitrary restaurant_id values (1, 4, 5, 6, 7)
4. These don't match actual user IDs → **No data returned**

## Solution Options

### Option 1: Find and Use Actual Restaurant Owner IDs (Recommended)

**Step 1**: Query your actual restaurant owner IDs
```sql
-- Run this in Database B (Supabase SQL Editor)
SELECT id, email, restaurant_name, restaurant_uid, approval_status
FROM restaurant_owners
WHERE approval_status = 'approved'
ORDER BY id;
```

**Step 2**: Note the actual IDs (e.g., id=12, id=15, etc.)

**Step 3**: Update your sample data with these actual IDs
```sql
-- Delete old sample data first
DELETE FROM restaurant_order_transactions WHERE restaurant_id IN (1,4,5,6,7);
DELETE FROM restaurant_earnings_data WHERE restaurant_id IN (1,4,5,6,7);

-- Insert with ACTUAL IDs
INSERT INTO restaurant_earnings_data (
    restaurant_id,  -- Use ACTUAL id from step 1
    restaurant_name,
    -- ... rest of data
) VALUES (
    12,  -- Example: actual id from restaurant_owners
    'Pizza Paradise',
    -- ... rest of values
);
```

### Option 2: Create Test Accounts with Known IDs

**Step 1**: Create new test restaurant owners
```sql
-- In Database B
INSERT INTO restaurant_owners (
    email, password_hash, restaurant_name, restaurant_phone,
    restaurant_address, approval_status, restaurant_uid
) VALUES 
('pizza@test.com', 'hashed_password', 'Pizza Paradise', '+91-9876543210', 'Test Address 1', 'approved', 'REST001'),
('burger@test.com', 'hashed_password', 'Burger Junction', '+91-9876543211', 'Test Address 2', 'approved', 'REST002')
RETURNING id, email, restaurant_name;
```

**Step 2**: Use the returned IDs in your earnings data

### Option 3: Use Dynamic Matching by Restaurant Name

Run this script that automatically matches by restaurant name:

```sql
-- For each restaurant, find ID by name and insert earnings data
DO $$
DECLARE
    v_restaurant_id INTEGER;
BEGIN
    -- Pizza Paradise
    SELECT id INTO v_restaurant_id 
    FROM restaurant_owners 
    WHERE restaurant_name ILIKE '%Pizza Paradise%' 
    LIMIT 1;
    
    IF v_restaurant_id IS NOT NULL THEN
        INSERT INTO restaurant_earnings_data (
            restaurant_id, restaurant_name, restaurant_phone, restaurant_email,
            total_lifetime_earnings, total_completed_orders, commission_rate,
            total_commission_paid, has_bank_details,
            bank_account_number, bank_ifsc_code, bank_account_holder_name, upi_id,
            last_synced_at, data_sent_by, sync_status
        ) VALUES (
            v_restaurant_id,
            'Pizza Paradise', 
            '+91-9876543210', 
            'contact@pizzaparadise.com',
            24600.00, 15, 0.2000, 6150.00, true,
            '1234567890123', 'HDFC0001234', 'Pizza Paradise Pvt Ltd',
            'pizzaparadise@paytm', NOW(), 'admin@khaogully.com', 'success'
        )
        ON CONFLICT (restaurant_id) DO UPDATE SET
            total_lifetime_earnings = EXCLUDED.total_lifetime_earnings,
            updated_at = NOW();
            
        -- Insert transactions for this restaurant
        INSERT INTO restaurant_order_transactions (
            transaction_id, restaurant_id, order_id, order_date,
            customer_name, customer_phone, delivery_address,
            order_total, platform_commission, delivery_fee, net_amount,
            is_paid, paid_at, payout_cycle_id, payout_reference, synced_at
        ) VALUES 
        ('ORD-1001-' || v_restaurant_id, v_restaurant_id, 1001, '2025-11-15 14:30:00+00', 
         'Rahul Sharma', '+91-9988776655', 'Room 101, Hostel A', 
         330.00, 66.00, 0.00, 264.00, true, '2025-11-20 10:00:00+00', 
         1, 'PAY-NOV-W3-2025', NOW())
        ON CONFLICT (transaction_id) DO NOTHING;
        
        RAISE NOTICE 'Inserted data for Pizza Paradise with ID: %', v_restaurant_id;
    ELSE
        RAISE NOTICE 'Pizza Paradise not found in restaurant_owners';
    END IF;
END $$;
```

## Quick Test

After fixing the IDs, test with:

```sql
-- Verify data is linked correctly
SELECT 
    ro.id as owner_id,
    ro.email,
    ro.restaurant_name as owner_name,
    red.restaurant_id,
    red.restaurant_name as earnings_name,
    red.total_lifetime_earnings,
    red.total_completed_orders
FROM restaurant_owners ro
LEFT JOIN restaurant_earnings_data red ON red.restaurant_id = ro.id
WHERE ro.approval_status = 'approved'
ORDER BY ro.id;
```

Expected result: You should see matching data for each restaurant owner.

## Frontend Test

1. Login with a restaurant owner account
2. Navigate to `/earnings`
3. You should see:
   - Total lifetime earnings
   - Pending earnings
   - Transaction history

## Common Issues

### "No earnings data found"
- **Cause**: restaurant_id in earnings table doesn't match user's ID
- **Fix**: Use Option 1 above to get correct IDs

### "Empty transaction history"
- **Cause**: restaurant_id mismatch in `restaurant_order_transactions`
- **Fix**: Ensure ALL inserts use the same correct restaurant_id

### "Bank details not showing"
- **Cause**: Field is set to NULL or FALSE
- **Fix**: Update `has_bank_details = true` and fill bank fields

## Need Help?

1. Run this diagnostic query:
```sql
-- Show what IDs exist vs what data exists
SELECT 'Owners' as source, id, restaurant_name FROM restaurant_owners
UNION ALL
SELECT 'Earnings', restaurant_id, restaurant_name FROM restaurant_earnings_data
ORDER BY source, id;
```

2. Check the backend logs for the exact query being executed
3. Verify the logged-in user's ID matches the data
