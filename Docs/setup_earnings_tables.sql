-- ================================================
-- KhaaoGali Restaurant Portal Integration
-- Earnings Database Setup Script
-- ================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main earnings summary table
CREATE TABLE IF NOT EXISTS restaurant_earnings_data (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL UNIQUE,
    restaurant_name VARCHAR(255) NOT NULL,
    restaurant_phone VARCHAR(20),
    restaurant_email VARCHAR(255),
    total_lifetime_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_completed_orders INTEGER NOT NULL DEFAULT 0,
    commission_rate DECIMAL(5, 4) NOT NULL,
    total_commission_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    has_bank_details BOOLEAN NOT NULL DEFAULT FALSE,
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    bank_account_holder_name VARCHAR(255),
    upi_id VARCHAR(100),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_sent_by VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction history table
CREATE TABLE IF NOT EXISTS restaurant_order_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    restaurant_id INTEGER NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_restaurant_earnings_restaurant_id ON restaurant_earnings_data(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_earnings_last_synced ON restaurant_earnings_data(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_transactions_restaurant_id ON restaurant_order_transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_transactions_order_date ON restaurant_order_transactions(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_transactions_is_paid ON restaurant_order_transactions(is_paid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_transactions_order_restaurant ON restaurant_order_transactions(order_id, restaurant_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_restaurant_earnings_updated_at ON restaurant_earnings_data;
CREATE TRIGGER update_restaurant_earnings_updated_at
    BEFORE UPDATE ON restaurant_earnings_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_transactions_updated_at ON restaurant_order_transactions;
CREATE TRIGGER update_order_transactions_updated_at
    BEFORE UPDATE ON restaurant_order_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint
ALTER TABLE restaurant_order_transactions 
    DROP CONSTRAINT IF EXISTS fk_restaurant_earnings;
    
ALTER TABLE restaurant_order_transactions 
    ADD CONSTRAINT fk_restaurant_earnings 
    FOREIGN KEY (restaurant_id) 
    REFERENCES restaurant_earnings_data(restaurant_id) 
    ON DELETE CASCADE;

-- Add table comments
COMMENT ON TABLE restaurant_earnings_data IS 'Stores restaurant earnings data synced from KhaaoGali admin system';
COMMENT ON TABLE restaurant_order_transactions IS 'Stores individual order-level earnings history for restaurants';

-- Grant permissions to service role (adjust as needed)
GRANT ALL ON restaurant_earnings_data TO service_role;
GRANT ALL ON restaurant_order_transactions TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verification query
SELECT 'Setup complete! Tables created successfully.' AS status;
