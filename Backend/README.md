# Restaurant Order Management System - Backend

Backend API for the Restaurant Order Management System built with FastAPI.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Supabase account (2 projects: Database A and Database B)
- pip package manager

### Setup Instructions

#### 1. Install Dependencies
```bash
cd Backend
pip install -r requirements.txt
```

#### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp ../.env.example ../.env
```

Edit `.env` and fill in your credentials:
- `SUPABASE_URL_DBB` and `SUPABASE_SERVICE_KEY_DBB` (Database B - new project)
- `SUPABASE_URL_DBA` and `SUPABASE_SERVICE_KEY_DBA` (Database A - existing production)
- `JWT_SECRET_KEY` (generate using: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

#### 3. Setup Database B (Backend Management Database)
1. Create a new Supabase project for Database B
2. Go to SQL Editor in Supabase Dashboard
3. Copy the contents of `../setup_database_b.sql`
4. Paste and run the SQL script
5. Verify all 4 tables were created: `admin_users`, `restaurant_owners`, `fetched_orders`, `order_responses`

#### 4. Create Initial Admin User
```bash
python create_admin.py
```

Follow the prompts and note down the admin credentials.

#### 5. Run the Backend Server
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/signup` - Restaurant owner signup
- `POST /api/auth/login` - Restaurant owner login
- `POST /api/admin/login` - Admin login

### Restaurant Owner
- `GET /api/owner/status` - Get owner status
- `POST /api/owner/fetch-orders` - Fetch orders from Database A
- `POST /api/owner/submit-response` - Submit accept/reject decisions

### Admin
- `GET /api/admin/pending-owners` - Get pending approvals
- `GET /api/admin/all-owners` - Get all restaurant owners
- `GET /api/admin/all-restaurants` - Get restaurants from Database A
- `PUT /api/admin/approve-owner/{owner_id}` - Approve owner and assign UID
- `PUT /api/admin/reject-owner/{owner_id}` - Reject owner
- `PUT /api/admin/assign-uid/{owner_id}` - Assign restaurant UID

## 🗂️ Project Structure

```
Backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration and settings
├── database.py            # Database connections (DBA & DBB)
├── create_admin.py        # Script to create initial admin
├── requirements.txt       # Python dependencies
├── models/
│   ├── __init__.py
│   └── schemas.py         # Pydantic models
├── routes/
│   ├── __init__.py
│   ├── auth.py           # Restaurant owner authentication
│   ├── admin_auth.py     # Admin authentication
│   ├── owner.py          # Restaurant owner endpoints
│   └── admin.py          # Admin endpoints
└── utils/
    ├── __init__.py
    ├── auth.py           # Password hashing and JWT utilities
    └── dependencies.py   # FastAPI dependencies for auth
```

## 🔒 Security Notes

- All passwords are hashed using bcrypt
- JWT tokens expire after 24 hours (configurable)
- Database B uses service role key for full access
- Database A uses service role key but only for READ operations
- CORS is configured for allowed origins only

## 🧪 Testing

Test endpoints using curl or Postman:

```bash
# Health check
curl http://localhost:8000/health

# Restaurant owner signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@restaurant.com",
    "password": "SecurePass123",
    "full_name": "John Doe",
    "phone": "+91-9876543210",
    "restaurant_name": "Tasty Bites",
    "restaurant_address": "123 Main St, Mumbai",
    "restaurant_phone": "+91-9876543211"
  }'
```

## 📝 Notes

- Database A (DBA) is **READ-ONLY** for fetching orders
- Database B (DBB) has **FULL ACCESS** for managing backend data
- Orders are fetched with `status='pending'` only
- Order responses update the status in Database A to 'confirmed' or 'cancelled'

## 🐛 Troubleshooting

**Database Connection Issues:**
- Verify Supabase URLs and keys in `.env`
- Check if Database B tables were created successfully
- Ensure Database A has the required tables: `customer_orders`, `restaurants`, `customers`

**Import Errors:**
- Make sure you're in the Backend directory when running commands
- Verify all dependencies are installed: `pip install -r requirements.txt`

**Admin Login Issues:**
- Run `create_admin.py` if you haven't created an admin user yet
- Check Database B `admin_users` table to verify the user exists

## 📞 Support

For issues or questions, please check the main Architecture_Prompt.md document in the root directory.
