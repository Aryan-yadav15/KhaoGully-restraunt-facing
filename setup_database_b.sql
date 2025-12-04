-- ============================================
-- Database B (DBB) Setup Script
-- Restaurant Order Management System
-- ============================================
-- Run this SQL in your NEW Supabase project (Database B)
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- Paste this entire script and click "Run"
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: Admin Users
-- ============================================
-- Stores admin accounts who can approve restaurant owners
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- ============================================
-- TABLE 2: Restaurant Owners
-- ============================================
-- Stores restaurant owner accounts and their approval status
CREATE TABLE IF NOT EXISTS restaurant_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    restaurant_name TEXT NOT NULL,
    restaurant_address TEXT NOT NULL,
    restaurant_phone TEXT NOT NULL,
    restaurant_email TEXT,
    restaurant_uid UUID,  -- References restaurants.id in Database A (assigned by admin)
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ============================================
-- TABLE 3: Fetched Orders Cache
-- ============================================
-- Caches orders fetched from Database A for restaurant owners
CREATE TABLE IF NOT EXISTS fetched_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_owner_id UUID REFERENCES restaurant_owners(id) ON DELETE CASCADE,
    order_id UUID NOT NULL UNIQUE,  -- Original order ID from Database A (UNIQUE to prevent duplicates)
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB NOT NULL,  -- Array of order items with customizations
    total_amount INTEGER NOT NULL,  -- Amount in paise
    payment_status TEXT,
    order_status TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 4: Order Responses
-- ============================================
-- Stores restaurant owner's accept/reject decisions for orders
CREATE TABLE IF NOT EXISTS order_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_owner_id UUID REFERENCES restaurant_owners(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,  -- Original order ID from Database A
    item_responses JSONB NOT NULL,  -- Array of {item_name, requested_qty, accepted_qty, rejected_qty, status}
    overall_status TEXT CHECK (overall_status IN ('accepted', 'partially_accepted', 'rejected')),
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    synced_to_dba BOOLEAN DEFAULT false  -- Whether response was synced back to Database A
);

-- ============================================
-- CREATE INDEXES for Performance
-- ============================================
-- Index on restaurant owners approval status (for admin dashboard filtering)
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_approval ON restaurant_owners(approval_status);

-- Index on restaurant owners UID (for quick lookup)
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_uid ON restaurant_owners(restaurant_uid);

-- Index on fetched orders by owner (for order retrieval)
CREATE INDEX IF NOT EXISTS idx_fetched_orders_owner ON fetched_orders(restaurant_owner_id);

-- Index on order responses by owner (for response tracking)
CREATE INDEX IF NOT EXISTS idx_order_responses_owner ON order_responses(restaurant_owner_id);

-- Index on order responses by order_id (for checking if already responded)
CREATE INDEX IF NOT EXISTS idx_order_responses_order ON order_responses(order_id);

-- ============================================
-- Row Level Security (RLS) - Optional
-- ============================================
-- Uncomment these if you want to enable RLS for additional security
-- For now, we'll use service role key which bypasses RLS

-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE restaurant_owners ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fetched_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_responses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify all tables were created successfully
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admin_users', 'restaurant_owners', 'fetched_orders', 'order_responses')
ORDER BY tablename;

-- Expected output: 4 rows showing all table names
-- ============================================
-- END OF SCRIPT
-- ============================================
