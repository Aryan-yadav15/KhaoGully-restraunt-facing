-- ================================================================
-- ALTER EARNINGS TABLES TO USE UUID FOR restaurant_id
-- This migration updates both tables to match restaurant_owners.id type
-- ================================================================

-- Step 0: Delete existing data with invalid integer IDs
DELETE FROM public.restaurant_order_transactions WHERE restaurant_id IN (1,4,5,6,7);
DELETE FROM public.restaurant_earnings_data WHERE restaurant_id IN (1,4,5,6,7);

-- Step 1: Drop foreign key constraint
ALTER TABLE public.restaurant_order_transactions 
    DROP CONSTRAINT IF EXISTS fk_restaurant_earnings;

-- Step 2: Drop indexes that reference restaurant_id
DROP INDEX IF EXISTS public.idx_order_transactions_restaurant_id;
DROP INDEX IF EXISTS public.idx_order_transactions_order_restaurant;
DROP INDEX IF EXISTS public.idx_restaurant_earnings_restaurant_id;

-- Step 3: Alter restaurant_earnings_data table - change restaurant_id to UUID
ALTER TABLE public.restaurant_earnings_data 
    ALTER COLUMN restaurant_id TYPE UUID USING restaurant_id::text::uuid;

-- Step 4: Alter restaurant_order_transactions table - change restaurant_id to UUID
ALTER TABLE public.restaurant_order_transactions 
    ALTER COLUMN restaurant_id TYPE UUID USING restaurant_id::text::uuid;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_earnings_restaurant_id 
    ON public.restaurant_earnings_data USING btree (restaurant_id) 
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_order_transactions_restaurant_id 
    ON public.restaurant_order_transactions USING btree (restaurant_id) 
    TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_transactions_order_restaurant 
    ON public.restaurant_order_transactions USING btree (order_id, restaurant_id) 
    TABLESPACE pg_default;

-- Step 6: Re-add foreign key constraint
ALTER TABLE public.restaurant_order_transactions 
    ADD CONSTRAINT fk_restaurant_earnings 
    FOREIGN KEY (restaurant_id) 
    REFERENCES public.restaurant_earnings_data (restaurant_id) 
    ON DELETE CASCADE;

-- Step 7: Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('restaurant_earnings_data', 'restaurant_order_transactions') 
    AND column_name = 'restaurant_id'
ORDER BY table_name;

-- Success message
SELECT '✓ Migration completed successfully! restaurant_id is now UUID type in both tables.' as status;
