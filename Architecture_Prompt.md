# Restaurant Order Management System - Backend Development Guide

## 📋 Project Overview

Build a comprehensive restaurant order management system where restaurant owners can view and manage pooled orders from a food delivery platform. The system includes admin approval workflow, order aggregation, and acceptance/rejection capabilities.

---

## 🏗️ System Architecture

### Technology Stack
- **Backend Framework**: FastAPI (Python)
- **Frontend**: React + TypeScript + Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Environment Management**: `.env` file for credentials

### Database Architecture

#### Database A (DBA) - Existing Production Database (READ-ONLY)
**Purpose**: End-user order management system (already deployed)  
**Access**: Read-only connection via restaurant UID

**Key Tables** (from attached schema):
```
┌─────────────────────┐
│   customer_orders   │  ← FETCH FROM HERE
├─────────────────────┤
│ id (UUID)           │
│ pool_id (UUID)      │
│ customer_id (UUID)  │
│ restaurant_id (UUID)│  ← Filter by this
│ items (JSONB)       │  ← [{menu_item_id, name, quantity, unit_price, customizations, subtotal}]
│ total (INT)         │  ← Amount in paise
│ payment_status      │  ← 'pending', 'paid', 'failed'
│ payment_id (TEXT)   │
│ status (TEXT)       │  ← 'pooling', 'confirmed', 'out_for_delivery', 'delivered'
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│    restaurants      │
├─────────────────────┤
│ id (UUID)           │
│ name (TEXT)         │
│ address (TEXT)      │
│ phone (TEXT)        │
│ email (TEXT)        │
└─────────────────────┘

┌─────────────────────┐
│     customers       │
├─────────────────────┤
│ id (UUID)           │
│ full_name (TEXT)    │
│ phone (TEXT)        │
│ email (TEXT)        │
└─────────────────────┘
```

#### Database B (DBB) - New Backend Database (FULL CONTROL)
**Purpose**: Manage restaurant owners, admin panel, and cached orders  
**Access**: Full read/write via service role

**Required Tables** (TO BE CREATED):
```
┌──────────────────────┐
│    admin_users       │
├──────────────────────┤
│ id (UUID, PK)        │
│ email (TEXT, UNIQUE) │
│ password_hash (TEXT) │
│ full_name (TEXT)     │
│ created_at (TIMESTAMP)│
│ last_login (TIMESTAMP)│
└──────────────────────┘

┌───────────────────────────┐
│  restaurant_owners        │
├───────────────────────────┤
│ id (UUID, PK)             │
│ email (TEXT, UNIQUE)      │
│ password_hash (TEXT)      │
│ full_name (TEXT)          │
│ phone (TEXT)              │
│ restaurant_name (TEXT)    │
│ restaurant_address (TEXT) │
│ restaurant_phone (TEXT)   │
│ restaurant_email (TEXT)   │
│ restaurant_uid (UUID, FK) │  ← NULL until admin assigns (references restaurants.id in DBA)
│ approval_status (TEXT)    │  ← 'pending', 'approved', 'rejected'
│ created_at (TIMESTAMP)    │
│ approved_at (TIMESTAMP)   │
│ approved_by (UUID, FK)    │  ← References admin_users.id
└───────────────────────────┘

┌──────────────────────────┐
│   fetched_orders         │  ← Cache orders from DBA
├──────────────────────────┤
│ id (UUID, PK)            │
│ restaurant_owner_id (FK) │  ← References restaurant_owners.id
│ order_id (UUID)          │  ← Original order ID from DBA
│ customer_name (TEXT)     │
│ customer_phone (TEXT)    │
│ items (JSONB)            │  ← Array of order items
│ total_amount (INT)       │
│ payment_status (TEXT)    │
│ order_status (TEXT)      │
│ fetched_at (TIMESTAMP)   │
│ created_at (TIMESTAMP)   │
└──────────────────────────┘

┌───────────────────────────┐
│   order_responses         │  ← Store accept/reject decisions
├───────────────────────────┤
│ id (UUID, PK)             │
│ restaurant_owner_id (FK)  │
│ order_id (UUID)           │  ← References order from DBA
│ item_responses (JSONB)    │  ← [{item_name, requested_qty, accepted_qty, rejected_qty, status}]
│ overall_status (TEXT)     │  ← 'accepted', 'partially_accepted', 'rejected'
│ responded_at (TIMESTAMP)  │
│ synced_to_dba (BOOLEAN)   │  ← Whether response was sent back to DBA
└───────────────────────────┘
```

---

## 🎯 Core Features & User Flows

### 1️⃣ Restaurant Owner Registration Flow

**Signup Page** (`/signup`)
- Form fields:
  - Personal Details:
    - Full Name (required)
    - Email (required, unique)
    - Phone Number (required)
    - Password (required, min 8 chars)
  - Restaurant Details:
    - Restaurant Name (required)
    - Restaurant Address (required)
    - Restaurant Phone (required)
    - Restaurant Email (optional)

- Backend Actions:
  - Hash password using bcrypt
  - Insert into `restaurant_owners` table with `approval_status='pending'` and `restaurant_uid=NULL`
  - Send success response

**Post-Signup Behavior**:
- Redirect to login page with message: "Account created! Please wait for admin approval."

---

### 2️⃣ Restaurant Owner Login Flow

**Login Page** (`/login`)
- Form fields: Email, Password
- Backend Actions:
  - Verify credentials against `restaurant_owners` table
  - Check `approval_status`:
    - If `'pending'` → Show message: "Your account is under review. Please wait for admin approval."
    - If `'rejected'` → Show message: "Your account was rejected. Contact support."
    - If `'approved'` AND `restaurant_uid IS NULL` → Show message: "Admin has approved your account but hasn't assigned a restaurant UID yet. Please wait."
    - If `'approved'` AND `restaurant_uid IS NOT NULL` → Generate JWT token, redirect to `/orders`

---

### 3️⃣ Admin Panel

**Admin Login** (`/admin/login`)
- Separate login for admin users (from `admin_users` table)
- Admin credentials are created via Python setup script

**Admin Dashboard** (`/admin/dashboard`)
- Display all restaurant owners with columns:
  - Full Name
  - Email
  - Phone
  - Restaurant Name
  - Restaurant Address
  - Status (Pending/Approved/Rejected)
  - UID Assignment (Dropdown or Search)
  - Action Buttons (Approve/Reject/Assign UID)

**Admin Actions**:
1. **View Pending Registrations**:
   - Query: `SELECT * FROM restaurant_owners WHERE approval_status='pending'`

2. **Approve Account**:
   - Update `approval_status='approved'`, `approved_at=NOW()`, `approved_by=<admin_id>`

3. **Assign Restaurant UID**:
   - Show dropdown of all restaurants from DBA (`SELECT id, name FROM restaurants`)
   - Allow admin to select and assign `restaurant_uid`
   - Update `restaurant_owners.restaurant_uid = <selected_restaurant_id>`

4. **Reject Account**:
   - Update `approval_status='rejected'`

---

### 4️⃣ Restaurant Owner Orders Page

**Orders Dashboard** (`/orders`)

**Initial State**:
- Display restaurant name and owner details
- Show "Check Orders" button

**When "Check Orders" Clicked**:
1. Fetch orders from DBA using assigned `restaurant_uid`:
   ```sql
   SELECT 
     co.id,
     co.items,
     co.total,
     co.payment_status,
     co.status,
     c.full_name as customer_name,
     c.phone as customer_phone
   FROM customer_orders co
   JOIN customers c ON co.customer_id = c.id
   WHERE co.restaurant_id = '<restaurant_uid>'
     AND co.status = 'confirmed'
     AND co.payment_status = 'paid'
   ```

2. Store fetched orders in DBB (`fetched_orders` table)

3. Process and display in two sections:

---

#### 📊 Section 1: Cumulative Order View (Top Section)

**Purpose**: Aggregate all items across multiple orders

**Display Format**:
```
┌─────────────────────────────────────────────────────────┐
│         CUMULATIVE ORDER SUMMARY                        │
├──────────────────┬──────────┬─────────────────────────┤
│ Item Name        │ Quantity │ Actions                 │
├──────────────────┼──────────┼─────────────────────────┤
│ Margherita Pizza │ 10       │ [Accept] [Decline]      │
│ Naan             │ 15       │ [Accept] [Decline]      │
│ Paneer Tikka     │ 8        │ [Accept] [Decline]      │
│ Garlic Bread     │ 12       │ [Accept] [Decline]      │
└──────────────────┴──────────┴─────────────────────────┘
```

**Interaction Logic**:
- **Accept Button**:
  - Mark entire quantity as accepted
  - Button turns green, "Accepted: 10/10"

- **Decline Button**:
  - Show increment/decrement modal:
    ```
    ┌─────────────────────────────────────┐
    │ Decline Quantity for "Naan"        │
    ├─────────────────────────────────────┤
    │ Total Requested: 15                 │
    │                                     │
    │ Decline:  [-]  5  [+]   (0-15)     │
    │                                     │
    │ Accepting: 10 out of 15             │
    │                                     │
    │         [Cancel]  [Confirm]         │
    └─────────────────────────────────────┘
    ```
  - Update display: "Accepted: 10/15, Declined: 5/15"

**Bottom of Section 1**:
- **[Confirm All Decisions]** button
- Validates that all items have been accepted/declined
- If incomplete, show error: "Please accept or decline all items"

---

#### 📋 Section 2: Individual Orders View (Bottom Section)

**Purpose**: Show detailed breakdown of each customer order

**Display Format**:
```
┌──────────────────────────────────────────────────────────┐
│         INDIVIDUAL ORDERS                                │
├──────────────────────────────────────────────────────────┤
│ Order #1 (ID: abc-123)                                   │
│ Customer: Aryan Kumar | Phone: +91-9876543215           │
│ ─────────────────────────────────────────────────────── │
│ • Margherita Pizza x2  ₹500                              │
│   Customizations: Extra cheese, no olives                │
│ • Garlic Bread x1  ₹80                                   │
│ ─────────────────────────────────────────────────────── │
│ Total: ₹580                                              │
├──────────────────────────────────────────────────────────┤
│ Order #2 (ID: def-456)                                   │
│ Customer: Priya Sharma | Phone: +91-9876543216          │
│ ─────────────────────────────────────────────────────── │
│ • Classic Burger x1  ₹150                                │
│   Customizations: No onions                              │
│ • French Fries x1  ₹80                                   │
│ • Coke x1  ₹50                                           │
│ ─────────────────────────────────────────────────────── │
│ Total: ₹280                                              │
└──────────────────────────────────────────────────────────┘
```

**Data Structure**:
- Parse `items` JSONB array from `customer_orders`
- Display: item name, quantity, price, customizations
- Show customer name and phone (from JOIN with `customers` table)

---

### 5️⃣ Confirm and Sync Response

**When "Confirm All Decisions" Clicked**:

1. **Validate**:
   - Check all cumulative items have accept/decline decisions
   - Calculate total accepted vs requested quantities

2. **Store in DBB**:
   - Insert into `order_responses` table:
   ```json
   {
     "restaurant_owner_id": "...",
     "item_responses": [
       {
         "item_name": "Naan",
         "requested_qty": 15,
         "accepted_qty": 10,
         "rejected_qty": 5,
         "status": "partially_accepted"
       },
       {
         "item_name": "Paneer Tikka",
         "requested_qty": 8,
         "accepted_qty": 8,
         "rejected_qty": 0,
         "status": "accepted"
       }
     ],
     "overall_status": "partially_accepted",
     "responded_at": "2025-11-26T20:30:00Z",
     "synced_to_dba": false
   }
   ```

3. **Sync to DBA** (Optional Future Enhancement):
   - Update `customer_orders.status` in DBA based on acceptance
   - If fully accepted → status remains 'confirmed'
   - If rejected → update status to 'cancelled' or add notes

4. **Show Success Message**:
   - "Order response submitted successfully!"
   - Clear the orders view
   - Reset to initial state with "Check Orders" button

---

## 🔧 Backend API Endpoints

### Authentication Endpoints

```
POST /api/auth/signup
Body: {
  full_name, email, phone, password,
  restaurant_name, restaurant_address, restaurant_phone, restaurant_email
}
Response: { message, user_id }

POST /api/auth/login
Body: { email, password }
Response: { token, user_data, status }

POST /api/admin/login
Body: { email, password }
Response: { token, admin_data }
```

### Restaurant Owner Endpoints

```
GET /api/owner/status
Headers: { Authorization: Bearer <token> }
Response: { approval_status, restaurant_uid, restaurant_name }

POST /api/owner/fetch-orders
Headers: { Authorization: Bearer <token> }
Response: { cumulative_orders, individual_orders }

POST /api/owner/submit-response
Headers: { Authorization: Bearer <token> }
Body: { item_responses, overall_status }
Response: { success, message }
```

### Admin Endpoints

```
GET /api/admin/pending-owners
Headers: { Authorization: Bearer <admin_token> }
Response: { pending_owners[] }

GET /api/admin/all-restaurants  # Fetch from DBA
Headers: { Authorization: Bearer <admin_token> }
Response: { restaurants[] }

PUT /api/admin/approve-owner/:owner_id
Headers: { Authorization: Bearer <admin_token> }
Body: { restaurant_uid }
Response: { success, message }

PUT /api/admin/reject-owner/:owner_id
Headers: { Authorization: Bearer <admin_token> }
Response: { success, message }
```

---

## 📝 Database Setup Scripts

### Script 1: Setup DBB (Database B)

**File**: `setup_dbb.py`

```python
"""
Create all necessary tables in Database B (backend management)
Run this script once during initial setup
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Database B credentials
SUPABASE_URL_DBB = os.getenv("SUPABASE_URL_DBB")
SUPABASE_KEY_DBB = os.getenv("SUPABASE_SERVICE_KEY_DBB")

supabase_dbb = create_client(SUPABASE_URL_DBB, SUPABASE_KEY_DBB)

# SQL to create tables
CREATE_TABLES_SQL = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Restaurant Owners Table
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
    restaurant_uid UUID,  -- References restaurants.id in DBA
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES admin_users(id)
);

-- Fetched Orders Cache Table
CREATE TABLE IF NOT EXISTS fetched_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_owner_id UUID REFERENCES restaurant_owners(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,  -- Original order ID from DBA
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB NOT NULL,
    total_amount INTEGER NOT NULL,
    payment_status TEXT,
    order_status TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ
);

-- Order Responses Table
CREATE TABLE IF NOT EXISTS order_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_owner_id UUID REFERENCES restaurant_owners(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    item_responses JSONB NOT NULL,
    overall_status TEXT CHECK (overall_status IN ('accepted', 'partially_accepted', 'rejected')),
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    synced_to_dba BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_approval ON restaurant_owners(approval_status);
CREATE INDEX IF NOT EXISTS idx_restaurant_owners_uid ON restaurant_owners(restaurant_uid);
CREATE INDEX IF NOT EXISTS idx_fetched_orders_owner ON fetched_orders(restaurant_owner_id);
CREATE INDEX IF NOT EXISTS idx_order_responses_owner ON order_responses(restaurant_owner_id);
"""

# Execute SQL
result = supabase_dbb.rpc('exec_sql', {'query': CREATE_TABLES_SQL}).execute()
print("✅ Database B tables created successfully!")
```

### Script 2: Create Initial Admin User

**File**: `create_admin.py`

```python
"""
Create initial admin user for the system
Run this once to create first admin account
"""

import os
import bcrypt
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL_DBB = os.getenv("SUPABASE_URL_DBB")
SUPABASE_KEY_DBB = os.getenv("SUPABASE_SERVICE_KEY_DBB")

supabase_dbb = create_client(SUPABASE_URL_DBB, SUPABASE_KEY_DBB)

# Admin credentials
ADMIN_EMAIL = "admin@restaurant-system.com"
ADMIN_PASSWORD = "SecureAdmin@123"  # Change this!
ADMIN_NAME = "System Administrator"

# Hash password
password_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Insert admin user
result = supabase_dbb.table('admin_users').insert({
    'email': ADMIN_EMAIL,
    'password_hash': password_hash,
    'full_name': ADMIN_NAME
}).execute()

print(f"✅ Admin user created!")
print(f"   Email: {ADMIN_EMAIL}")
print(f"   Password: {ADMIN_PASSWORD}")
print(f"   ⚠️  IMPORTANT: Change the password after first login!")
```

---

## 🎨 Frontend Components Structure

```
src/
├── pages/
│   ├── Auth/
│   │   ├── Login.tsx           # Restaurant owner login
│   │   └── Signup.tsx          # Restaurant owner signup
│   ├── Admin/
│   │   ├── AdminLogin.tsx      # Admin login
│   │   └── AdminDashboard.tsx  # Admin panel
│   ├── Orders/
│   │   ├── OrdersPage.tsx      # Main orders dashboard
│   │   ├── CumulativeView.tsx  # Section 1: Cumulative orders
│   │   ├── IndividualView.tsx  # Section 2: Individual orders
│   │   └── DeclineModal.tsx    # Modal for quantity selection
│   └── Pending.tsx             # Pending approval message
├── components/
│   ├── Layout.tsx              # Common layout wrapper
│   ├── Navbar.tsx              # Navigation bar
│   └── ProtectedRoute.tsx      # Auth guard
├── services/
│   ├── api.ts                  # Axios/fetch wrapper
│   ├── auth.ts                 # Auth service
│   └── orders.ts               # Orders service
├── types/
│   ├── order.types.ts          # Order interfaces
│   └── user.types.ts           # User interfaces
└── utils/
    ├── formatters.ts           # Price/date formatters
    └── validators.ts           # Form validation
```

---

## 🔐 Environment Variables

**File**: `.env`

```env
# Database B (Backend Management) - Full Access
SUPABASE_URL_DBB=https://your-project-dbb.supabase.co
SUPABASE_SERVICE_KEY_DBB=your_service_role_key_dbb
SUPABASE_ANON_KEY_DBB=your_anon_key_dbb

# Database A (Production Orders) - Read Only
SUPABASE_URL_DBA=https://your-project-dba.supabase.co
SUPABASE_SERVICE_KEY_DBA=your_service_role_key_dba

# JWT Secret
JWT_SECRET_KEY=your_random_secret_key_here

# App Config
BACKEND_PORT=8000
FRONTEND_PORT=5173
```

---

## ✅ Implementation Roadmap

### Phase 1: Database Setup
- [ ] 1.1 - Create Supabase project for Database B (DBB)
- [ ] 1.2 - Run `setup_dbb.py` to create all tables
- [ ] 1.3 - Run `create_admin.py` to create initial admin user
- [ ] 1.4 - Verify Database A (DBA) connection (read-only)
- [ ] 1.5 - Test both database connections via Python

### Phase 2: Backend - Authentication
- [ ] 2.1 - Setup FastAPI project structure
- [ ] 2.2 - Create `.env` file with credentials
- [ ] 2.3 - Implement password hashing utilities (bcrypt)
- [ ] 2.4 - Create JWT token generation/verification
- [ ] 2.5 - Build `POST /api/auth/signup` endpoint
- [ ] 2.6 - Build `POST /api/auth/login` endpoint
- [ ] 2.7 - Build `POST /api/admin/login` endpoint
- [ ] 2.8 - Create authentication middleware
- [ ] 2.9 - Test all auth endpoints with Postman/curl

### Phase 3: Backend - Restaurant Owner Features
- [ ] 3.1 - Build `GET /api/owner/status` endpoint
- [ ] 3.2 - Build `POST /api/owner/fetch-orders` endpoint
- [ ] 3.3 - Implement DBA query logic to fetch orders by restaurant_uid
- [ ] 3.4 - Implement cumulative order aggregation logic
- [ ] 3.5 - Cache fetched orders in DBB (`fetched_orders` table)
- [ ] 3.6 - Build `POST /api/owner/submit-response` endpoint
- [ ] 3.7 - Implement order response storage in DBB
- [ ] 3.8 - Test order fetch and submission flow

### Phase 4: Backend - Admin Features
- [ ] 4.1 - Build `GET /api/admin/pending-owners` endpoint
- [ ] 4.2 - Build `GET /api/admin/all-restaurants` (fetch from DBA)
- [ ] 4.3 - Build `PUT /api/admin/approve-owner/:owner_id` endpoint
- [ ] 4.4 - Build `PUT /api/admin/reject-owner/:owner_id` endpoint
- [ ] 4.5 - Implement admin authorization checks
- [ ] 4.6 - Test all admin endpoints

### Phase 5: Frontend - Setup & Authentication
- [ ] 5.1 - Initialize Vite + React + TypeScript project
- [ ] 5.2 - Setup Tailwind CSS (or preferred UI library)
- [ ] 5.3 - Create routing structure (React Router)
- [ ] 5.4 - Build Login page (`/login`)
- [ ] 5.5 - Build Signup page (`/signup`)
- [ ] 5.6 - Build Admin Login page (`/admin/login`)
- [ ] 5.7 - Implement auth context/state management
- [ ] 5.8 - Create ProtectedRoute component
- [ ] 5.9 - Test authentication flows

### Phase 6: Frontend - Restaurant Owner Dashboard
- [ ] 6.1 - Build Orders Page layout (`/orders`)
- [ ] 6.2 - Implement "Check Orders" button and API call
- [ ] 6.3 - Build Cumulative Orders View (Section 1)
- [ ] 6.4 - Implement Accept/Decline buttons for each item
- [ ] 6.5 - Build Decline Quantity Modal with increment/decrement
- [ ] 6.6 - Build Individual Orders View (Section 2)
- [ ] 6.7 - Display customer details and order items
- [ ] 6.8 - Implement "Confirm All Decisions" button
- [ ] 6.9 - Add validation for incomplete responses
- [ ] 6.10 - Test complete order acceptance/rejection flow

### Phase 7: Frontend - Admin Dashboard
- [ ] 7.1 - Build Admin Dashboard page (`/admin/dashboard`)
- [ ] 7.2 - Display table of all restaurant owners
- [ ] 7.3 - Filter by approval status (Pending/Approved/Rejected)
- [ ] 7.4 - Build restaurant UID dropdown (fetch from DBA)
- [ ] 7.5 - Implement Approve button and API call
- [ ] 7.6 - Implement Reject button and API call
- [ ] 7.7 - Implement UID assignment and API call
- [ ] 7.8 - Add success/error notifications
- [ ] 7.9 - Test admin approval workflow

### Phase 8: UI/UX Polish
- [ ] 8.1 - Add loading spinners for async operations
- [ ] 8.2 - Implement error handling and user-friendly messages
- [ ] 8.3 - Add confirmation dialogs for critical actions
- [ ] 8.4 - Responsive design for mobile/tablet
- [ ] 8.5 - Add toast notifications for success/error
- [ ] 8.6 - Implement logout functionality
- [ ] 8.7 - Add "Pending Approval" page with clear messaging

### Phase 9: Testing & Bug Fixes
- [ ] 9.1 - Test complete signup → approval → login flow
- [ ] 9.2 - Test order fetching with multiple orders
- [ ] 9.3 - Test cumulative aggregation accuracy
- [ ] 9.4 - Test partial acceptance/rejection scenarios
- [ ] 9.5 - Test edge cases (empty orders, network errors)
- [ ] 9.6 - Fix any discovered bugs
- [ ] 9.7 - Code review and refactoring

### Phase 10: Deployment Preparation
- [ ] 10.1 - Add environment-specific configs (dev/prod)
- [ ] 10.2 - Setup CORS properly for production
- [ ] 10.3 - Add API rate limiting
- [ ] 10.4 - Setup logging for errors and requests
- [ ] 10.5 - Create deployment documentation
- [ ] 10.6 - Build frontend for production
- [ ] 10.7 - Deploy backend (e.g., Railway, Render, AWS)
- [ ] 10.8 - Deploy frontend (e.g., Vercel, Netlify)
- [ ] 10.9 - Test production deployment
- [ ] 10.10 - Setup monitoring and alerts

---

## 🚨 Important Implementation Notes

### Security Considerations
1. **Password Hashing**: Use bcrypt with salt for all passwords
2. **JWT Tokens**: Set appropriate expiration times (e.g., 24 hours)
3. **Input Validation**: Validate all user inputs on backend
4. **SQL Injection**: Use parameterized queries (Supabase handles this)
5. **CORS**: Restrict origins in production

### Database Connection Strategy
- **DBA Connection**: Use service role key for read-only access
- **DBB Connection**: Use service role key for full access
- **Connection Pooling**: Implement connection reuse for efficiency

### Cumulative Order Aggregation Logic
```python
# Example algorithm for cumulative orders
def aggregate_orders(orders: list) -> dict:
    cumulative = {}
    for order in orders:
        for item in order['items']:
            item_name = item['name']
            quantity = item['quantity']
            if item_name not in cumulative:
                cumulative[item_name] = {
                    'total_quantity': 0,
                    'occurrences': []
                }
            cumulative[item_name]['total_quantity'] += quantity
            cumulative[item_name]['occurrences'].append({
                'order_id': order['id'],
                'quantity': quantity,
                'customizations': item.get('customizations')
            })
    return cumulative
```

### Error Handling Patterns
- **Authentication Errors**: Return 401 with clear message
- **Authorization Errors**: Return 403 with reason
- **Validation Errors**: Return 400 with field-specific errors
- **Database Errors**: Log error, return 500 with generic message
- **Not Found**: Return 404 with entity type

---

## 📚 Additional Resources

### FastAPI Documentation
- [FastAPI Official Docs](https://fastapi.tiangolo.com/)
- [Pydantic Models](https://docs.pydantic.dev/)
- [JWT Authentication](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)

### React + TypeScript
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Router v6](https://reactrouter.com/en/main)

### Supabase
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## ❓ Questions & Clarifications

Before starting implementation, confirm:

1. **DBA Access**: Do you have read-only credentials for Database A?
2. **Restaurant Matching**: How will admin identify which DBA restaurant_id corresponds to which signup?
3. **Order Filtering**: Should we only fetch 'confirmed' + 'paid' orders, or include other statuses?
4. **Sync Back to DBA**: Should accepted/rejected responses update DBA, or just store in DBB?
5. **Multiple Pools**: Can one restaurant receive orders from multiple pools simultaneously?
6. **Real-time Updates**: Do orders need to refresh automatically, or manual refresh is fine?
7. **Order History**: Should owners see past responses, or only pending orders?

---

## 🎯 Success Criteria

The implementation is complete when:

✅ Restaurant owners can signup with restaurant details  
✅ Admin can approve/reject owners and assign restaurant UIDs  
✅ Approved owners can login and view pending approval message  
✅ Owners with assigned UID can fetch orders from DBA  
✅ Orders are displayed in cumulative + individual views  
✅ Owners can accept/partially decline items with quantity control  
✅ Responses are stored in DBB for tracking  
✅ All pages are responsive and user-friendly  
✅ Error handling is robust with clear messages  
✅ System is deployed and accessible via URLs  

---

**End of Document**

*Version: 1.0*  
*Last Updated: November 26, 2025*  
*Prepared for: AI Agent Implementation*
