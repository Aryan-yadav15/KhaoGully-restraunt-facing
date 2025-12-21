-- Migration to add order amount breakdown fields to fetched_orders table
-- This allows storing detailed pricing information from the customer-facing system
-- All amounts are stored in paise (1 rupee = 100 paise)

-- Add new columns to fetched_orders table
ALTER TABLE public.fetched_orders
  ADD COLUMN IF NOT EXISTS subtotal INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_fee INTEGER,
  ADD COLUMN IF NOT EXISTS platform_fee INTEGER,
  ADD COLUMN IF NOT EXISTS total_customer_paid INTEGER,
  ADD COLUMN IF NOT EXISTS amount_to_collect INTEGER;

-- Add comments to explain each field
COMMENT ON COLUMN public.fetched_orders.subtotal IS 'Items cost only - what restaurant receives (in paise)';
COMMENT ON COLUMN public.fetched_orders.delivery_fee IS 'Delivery charges (in paise)';
COMMENT ON COLUMN public.fetched_orders.platform_fee IS 'Platform charges (in paise)';
COMMENT ON COLUMN public.fetched_orders.total_customer_paid IS 'Full amount customer paid (in paise)';
COMMENT ON COLUMN public.fetched_orders.amount_to_collect IS 'Amount restaurant should collect/receive (in paise)';

-- Note: total_amount column remains for backward compatibility
-- It should equal total_customer_paid for new orders

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fetched_orders'
  AND column_name IN ('subtotal', 'delivery_fee', 'platform_fee', 'total_customer_paid', 'amount_to_collect')
ORDER BY column_name;
