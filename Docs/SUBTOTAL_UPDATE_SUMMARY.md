# Subtotal Update - Changes Summary

## Overview
Updated the system to display **subtotal** (restaurant earnings) instead of total order amount (which includes delivery fees) to restaurant owners. This ensures restaurants only see the amount they're actually earning from orders.

## Changes Made

### 1. Database Migration
**File:** `add_order_amount_breakdown_fields.sql`

Added 5 new columns to `fetched_orders` table:
- `subtotal` - Items cost only (what restaurant receives) in paise
- `delivery_fee` - Delivery charges in paise
- `platform_fee` - Platform charges in paise
- `total_customer_paid` - Full amount customer paid in paise
- `amount_to_collect` - Amount restaurant should collect in paise

**Run this SQL in Supabase:**
```sql
ALTER TABLE public.fetched_orders
  ADD COLUMN IF NOT EXISTS subtotal INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_fee INTEGER,
  ADD COLUMN IF NOT EXISTS platform_fee INTEGER,
  ADD COLUMN IF NOT EXISTS total_customer_paid INTEGER,
  ADD COLUMN IF NOT EXISTS amount_to_collect INTEGER;
```

### 2. Backend API Updates

#### `Backend/routes/webhook.py`
- Updated `IncomingOrder` model to accept new fields (subtotal, delivery_fee, platform_fee, total_customer_paid, amount_to_collect)
- Modified both `/receive-orders` and `/receive-order` endpoints to store these fields
- Fields are optional for backward compatibility

#### `Backend/routes/owner.py`
- **`/api/owner/fetch-orders`**: Now returns `subtotal` as `total_amount` (with fallback to old `total_amount` for existing data)
- **`/api/owner/order-history`**: Returns `subtotal` as `total_amount` for display
- **`/api/owner/earnings-transactions`**: Calculates earnings based on `subtotal` instead of `total_amount`
- **`/api/owner/earnings-monthly`**: Uses `subtotal` for monthly earnings calculations

All endpoints have **backward compatibility** - they fallback to `total_amount` if `subtotal` is not available (for old orders).

### 3. Customer-Facing Webhook Update

#### `Customer_Facing_Incoming_Data_On_Pool_Closing.md`
Updated `send_orders_to_backend()` function to include new fields in payload:
- `subtotal`
- `delivery_fee`
- `platform_fee`
- `total_customer_paid`
- `amount_to_collect`

## Frontend Display

The frontend **automatically** displays the correct amount because:
- Backend now returns `subtotal` as the `total_amount` field
- No frontend changes needed - displays show restaurant earnings correctly
- Pages affected:
  - Orders Dashboard (Individual View)
  - Order History
  - Earnings Dashboard

## Key Points

✅ **Restaurant owners now see only their earnings** (subtotal), not including delivery fees  
✅ **Backward compatible** - old orders without subtotal still work  
✅ **Earnings calculations** now use correct restaurant revenue  
✅ **All amounts stored in paise** for precision  
✅ **No frontend code changes required**  

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Test new orders coming from customer-facing system
- [ ] Verify Orders Dashboard shows correct amounts (should show subtotal only)
- [ ] Verify Order History shows correct amounts (should show subtotal only)
- [ ] Verify Earnings Dashboard calculates correctly
- [ ] Verify old orders (without subtotal) still display properly (will show old total_amount)

## Important Note About Existing Orders

**Existing orders in the database** will continue to show the old `total_amount` (including delivery fees) because they don't have the `subtotal` field populated. This is expected behavior due to backward compatibility.

**Only new orders** received after running the migration and updating the customer-facing system will show the correct subtotal (excluding delivery fees).

If you need to fix existing orders, you would need to recalculate and update the `subtotal` field for historical records manually.

## Notes

- `order_responses` table does **NOT** need modification - it only stores accept/reject decisions, not pricing info
- The `total_amount` field remains in database for backward compatibility but new orders should populate `subtotal`
- Commission and net earnings are now calculated on `subtotal`, which is the correct base amount
