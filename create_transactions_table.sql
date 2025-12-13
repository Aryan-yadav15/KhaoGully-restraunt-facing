-- Create restaurant_order_transactions table
CREATE TABLE IF NOT EXISTS public.restaurant_order_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    restaurant_id UUID NOT NULL,
    order_id INTEGER NOT NULL,
    order_date TIMESTAMPTZ NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    delivery_address TEXT,
    order_total DECIMAL(10, 2) NOT NULL,
    platform_commission DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    payout_cycle_id INTEGER,
    payout_reference VARCHAR(100),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_transactions_restaurant_id ON public.restaurant_order_transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_transactions_order_date ON public.restaurant_order_transactions(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_transactions_is_paid ON public.restaurant_order_transactions(is_paid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_transactions_order_restaurant ON public.restaurant_order_transactions(order_id, restaurant_id);

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update trigger
DROP TRIGGER IF EXISTS update_order_transactions_updated_at ON public.restaurant_order_transactions;
CREATE TRIGGER update_order_transactions_updated_at
    BEFORE UPDATE ON public.restaurant_order_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.restaurant_order_transactions IS 'Stores individual order-level earnings history for restaurants';
