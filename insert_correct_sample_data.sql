-- ================================================================
-- CORRECTED RESTAURANT PORTAL SAMPLE DATA
-- Using actual restaurant_owner UUIDs from database
-- ================================================================

-- ================================================================
-- TABLE 1: restaurant_earnings_data (Summary Data)
-- ================================================================

-- Biryani House - ID: fac8f673-635b-4641-b57b-d67252fc4fa9
INSERT INTO restaurant_earnings_data (
    restaurant_id, restaurant_name, restaurant_phone, restaurant_email,
    total_lifetime_earnings, total_completed_orders, commission_rate,
    total_commission_paid, has_bank_details,
    bank_account_number, bank_ifsc_code, bank_account_holder_name, upi_id,
    last_synced_at, data_sent_by, sync_status
) VALUES (
    'fac8f673-635b-4641-b57b-d67252fc4fa9',
    'Biryani House', 
    '+91-9876543212', 
    'amitjha@mail.com',
    21200.00,  -- Total net earnings
    13,  -- Total completed orders
    0.2000,  -- 20% commission
    5300.00,  -- Total commission paid
    true,
    '5678901234567',
    'HDFC0001234',
    'Biryani House Pvt Ltd',
    'biryanihouse@paytm',
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

-- Cafe Mocha - ID: a1779695-1d36-445a-83ea-7dfdc7b1af03
INSERT INTO restaurant_earnings_data (
    restaurant_id, restaurant_name, restaurant_phone, restaurant_email,
    total_lifetime_earnings, total_completed_orders, commission_rate,
    total_commission_paid, has_bank_details,
    bank_account_number, bank_ifsc_code, bank_account_holder_name, upi_id,
    last_synced_at, data_sent_by, sync_status
) VALUES (
    'a1779695-1d36-445a-83ea-7dfdc7b1af03',
    'Cafe Mocha', 
    '+91-9876543213', 
    'asdf@mail.com',
    12800.00,  -- Total net earnings
    8,  -- Total completed orders
    0.2000,  -- 20% commission
    3200.00,  -- Total commission paid
    true,
    '9876543210987',
    'ICICI0005678',
    'Cafe Mocha Private Limited',
    'cafemocha@gpay',
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

-- ================================================================
-- TABLE 2: restaurant_order_transactions (Transaction History)
-- ================================================================

-- ===== BIRYANI HOUSE ORDERS (13 orders) =====

INSERT INTO restaurant_order_transactions (
    transaction_id, restaurant_id, order_id, order_date,
    customer_name, customer_phone, delivery_address,
    order_total, platform_commission, delivery_fee, net_amount,
    is_paid, paid_at, payout_cycle_id, payout_reference, synced_at
) VALUES 
-- Paid orders (9 orders)
('ORD-3001-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3001, '2025-11-16 13:00:00+00', 'Deepak Jain', '+91-9665544332', 'Room 205, Hostel B', 270.00, 54.00, 0.00, 216.00, true, '2025-11-20 10:00:00+00', 1, 'PAY-NOV-W3-2025', NOW()),
('ORD-3002-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3002, '2025-11-17 20:30:00+00', 'Ritika Soni', '+91-9554433221', 'Flat 11A, Spring Valley', 350.00, 70.00, 0.00, 280.00, true, '2025-11-20 10:00:00+00', 1, 'PAY-NOV-W3-2025', NOW()),
('ORD-3003-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3003, '2025-11-18 19:15:00+00', 'Abhishek Thakur', '+91-9443322110', 'Room 312, Hostel C', 220.00, 44.00, 0.00, 176.00, true, '2025-11-20 10:00:00+00', 1, 'PAY-NOV-W3-2025', NOW()),
('ORD-3004-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3004, '2025-11-20 14:45:00+00', 'Nidhi Mishra', '+91-9332211009', 'Flat 4B, Royal Gardens', 320.00, 64.00, 0.00, 256.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),
('ORD-3005-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3005, '2025-11-22 21:00:00+00', 'Sachin Dubey', '+91-9221100998', 'Room 118, Hostel A', 280.00, 56.00, 0.00, 224.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),
('ORD-3006-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3006, '2025-11-24 18:30:00+00', 'Lavanya Reddy', '+91-9110099887', 'Flat 13C, Ocean View', 370.00, 74.00, 0.00, 296.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),
('ORD-3007-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3007, '2025-11-26 20:00:00+00', 'Yash Oberoi', '+91-9009988776', 'Room 225, Hostel B', 300.00, 60.00, 0.00, 240.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),
('ORD-3008-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3008, '2025-11-27 15:45:00+00', 'Kiara Singh', '+91-8998877665', 'Flat 8D, Maple Heights', 340.00, 68.00, 0.00, 272.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),
('ORD-3009-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3009, '2025-11-29 19:30:00+00', 'Manish Kumar', '+91-8887766554', 'Room 310, Hostel C', 260.00, 52.00, 0.00, 208.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),

-- Pending orders (4 orders)
('ORD-3010-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3010, '2025-12-01 13:15:00+00', 'Shruti Deshmukh', '+91-8776655443', 'Flat 2A, Pine Woods', 310.00, 62.00, 0.00, 248.00, false, NULL, NULL, NULL, NOW()),
('ORD-3011-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3011, '2025-12-01 20:00:00+00', 'Rahul Bhatt', '+91-8665544332', 'Room 115, Hostel A', 290.00, 58.00, 0.00, 232.00, false, NULL, NULL, NULL, NOW()),
('ORD-3012-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3012, '2025-12-02 18:45:00+00', 'Ananya Roy', '+91-8554433221', 'Flat 14B, Cedar Court', 380.00, 76.00, 0.00, 304.00, false, NULL, NULL, NULL, NOW()),
('ORD-3013-BH', 'fac8f673-635b-4641-b57b-d67252fc4fa9', 3013, '2025-12-03 16:00:00+00', 'Vivek Pandey', '+91-8443322110', 'Room 218, Hostel B', 330.00, 66.00, 0.00, 264.00, false, NULL, NULL, NULL, NOW())
ON CONFLICT (transaction_id) DO UPDATE SET
    order_total = EXCLUDED.order_total,
    platform_commission = EXCLUDED.platform_commission,
    net_amount = EXCLUDED.net_amount,
    is_paid = EXCLUDED.is_paid,
    paid_at = EXCLUDED.paid_at,
    payout_cycle_id = EXCLUDED.payout_cycle_id,
    payout_reference = EXCLUDED.payout_reference,
    synced_at = EXCLUDED.synced_at,
    updated_at = NOW();

-- ===== CAFE MOCHA ORDERS (8 orders) =====

INSERT INTO restaurant_order_transactions (
    transaction_id, restaurant_id, order_id, order_date,
    customer_name, customer_phone, delivery_address,
    order_total, platform_commission, delivery_fee, net_amount,
    is_paid, paid_at, payout_cycle_id, payout_reference, synced_at
) VALUES 
-- Paid orders (5 orders)
('ORD-4001-CM', 'a1779695-1d36-445a-83ea-7dfdc7b1af03', 4001, '2025-11-18 10:30:00+00', 'Tanya Chatterjee', '+91-9332211009', 'Room 305, Hostel C', 240.00, 48.00, 0.00, 192.00, true, '2025-11-20 10:00:00+00', 1, 'PAY-NOV-W3-2025', NOW()),
('ORD-4002-CM', 'a1779695-1d36-445a-83ea-7dfdc7b1af03', 4002, '2025-11-20 15:00:00+00', 'Kartik Arora', '+91-9221100998', 'Flat 6A, Willow Park', 200.00, 40.00, 0.00, 160.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),
('ORD-4003-CM', 'a1779695-1d36-445a-83ea-7dfdc7b1af03', 4003, '2025-11-23 11:45:00+00', 'Sara Khan', '+91-9110099887', 'Room 120, Hostel A', 180.00, 36.00, 0.00, 144.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),
('ORD-4004-CM', 'a1779695-1d36-445a-83ea-7dfdc7b1af03', 4004, '2025-11-26 16:30:00+00', 'Aman Sinha', '+91-9009988776', 'Flat 9A, Rosewood', 260.00, 52.00, 0.00, 208.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),
('ORD-4005-CM', 'a1779695-1d36-445a-83ea-7dfdc7b1af03', 4005, '2025-11-28 12:00:00+00', 'Diya Menon', '+91-8998877665', 'Room 230, Hostel B', 220.00, 44.00, 0.00, 176.00, true, '2025-11-30 09:00:00+00', 2, 'PAY-NOV-W4-2025', NOW()),

-- Pending orders (3 orders)
('ORD-4006-CM', 'a1779695-1d36-445a-83ea-7dfdc7b1af03', 4006, '2025-12-01 10:15:00+00', 'Raghav Tripathi', '+91-8887766554', 'Flat 11B, Bamboo Heights', 210.00, 42.00, 0.00, 168.00, false, NULL, NULL, NULL, NOW()),
('ORD-4007-CM', 'a1779695-1d36-445a-83ea-7dfdc7b1af03', 4007, '2025-12-02 14:30:00+00', 'Kriti Sharma', '+91-8776655443', 'Room 318, Hostel C', 250.00, 50.00, 0.00, 200.00, false, NULL, NULL, NULL, NOW()),
('ORD-4008-CM', 'a1779695-1d36-445a-83ea-7dfdc7b1af03', 4008, '2025-12-03 11:00:00+00', 'Aakash Joshi', '+91-8665544332', 'Flat 7C, Valley View', 280.00, 56.00, 0.00, 224.00, false, NULL, NULL, NULL, NOW())
ON CONFLICT (transaction_id) DO UPDATE SET
    order_total = EXCLUDED.order_total,
    platform_commission = EXCLUDED.platform_commission,
    net_amount = EXCLUDED.net_amount,
    is_paid = EXCLUDED.is_paid,
    paid_at = EXCLUDED.paid_at,
    payout_cycle_id = EXCLUDED.payout_cycle_id,
    payout_reference = EXCLUDED.payout_reference,
    synced_at = EXCLUDED.synced_at,
    updated_at = NOW();

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Verify the data is correctly linked
SELECT 
    ro.id as owner_uuid,
    ro.email,
    ro.restaurant_name as owner_name,
    red.restaurant_id,
    red.restaurant_name as earnings_name,
    red.total_lifetime_earnings,
    red.total_completed_orders,
    COUNT(rot.id) as transaction_count,
    SUM(CASE WHEN rot.is_paid THEN 1 ELSE 0 END) as paid_count,
    SUM(CASE WHEN NOT rot.is_paid THEN 1 ELSE 0 END) as pending_count
FROM restaurant_owners ro
LEFT JOIN restaurant_earnings_data red ON red.restaurant_id = ro.id
LEFT JOIN restaurant_order_transactions rot ON rot.restaurant_id = ro.id
WHERE ro.approval_status = 'approved'
GROUP BY ro.id, ro.email, ro.restaurant_name, red.restaurant_id, 
         red.restaurant_name, red.total_lifetime_earnings, red.total_completed_orders
ORDER BY ro.restaurant_name;

-- Check pending vs paid breakdown
SELECT 
    ro.restaurant_name,
    ro.email,
    COUNT(rot.id) as total_orders,
    SUM(CASE WHEN rot.is_paid THEN rot.net_amount ELSE 0 END) as paid_amount,
    SUM(CASE WHEN NOT rot.is_paid THEN rot.net_amount ELSE 0 END) as pending_amount,
    COUNT(CASE WHEN rot.is_paid THEN 1 END) as paid_count,
    COUNT(CASE WHEN NOT rot.is_paid THEN 1 END) as pending_count
FROM restaurant_owners ro
LEFT JOIN restaurant_order_transactions rot ON rot.restaurant_id = ro.id
WHERE ro.approval_status = 'approved'
GROUP BY ro.id, ro.restaurant_name, ro.email
ORDER BY pending_amount DESC;

-- Overall statistics
SELECT 
    '✓ Data inserted successfully!' as status,
    COUNT(DISTINCT red.restaurant_id) as restaurants_with_data,
    COUNT(rot.id) as total_transactions,
    SUM(rot.order_total) as total_order_value,
    SUM(rot.platform_commission) as total_commission,
    SUM(rot.net_amount) as total_restaurant_earnings,
    SUM(CASE WHEN rot.is_paid THEN 1 ELSE 0 END) as paid_orders,
    SUM(CASE WHEN NOT rot.is_paid THEN 1 ELSE 0 END) as pending_orders
FROM restaurant_earnings_data red
LEFT JOIN restaurant_order_transactions rot ON rot.restaurant_id = red.restaurant_id;
