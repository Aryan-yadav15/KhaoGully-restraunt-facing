# 🚀 Quick Start Commands

## Initial Setup (One-time)

### 1. Setup Database B
```bash
# Go to Supabase Dashboard → SQL Editor
# Run: setup_database_b.sql
```

### 2. Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit .env with your credentials
# - SUPABASE_URL_DBB (Database B URL)
# - SUPABASE_SERVICE_KEY_DBB (Database B service key)
# - SUPABASE_URL_DBA (Database A URL)
# - SUPABASE_SERVICE_KEY_DBA (Database A service key)
# - JWT_SECRET_KEY (generate with command below)

# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Install Backend Dependencies
```bash
cd Backend
pip install -r requirements.txt
```

### 4. Create Admin User
```bash
cd Backend
python create_admin.py
# Default: admin@khaogully.com / Admin@123456
```

---

## Daily Development

### Start Backend Server
```bash
cd Backend
python main.py
# Or: uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API Docs: http://localhost:8000/docs

### Start Frontend (once built)
```bash
cd Frontend
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Testing API with curl

### Restaurant Owner Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePass123",
    "full_name": "John Doe",
    "phone": "+91-9876543210",
    "restaurant_name": "Tasty Bites",
    "restaurant_address": "123 Main St, Mumbai",
    "restaurant_phone": "+91-9876543211"
  }'
```

### Admin Login
```bash
curl -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@khaogully.com",
    "password": "Admin@123456"
  }'
```

### Get Pending Owners (Admin)
```bash
curl http://localhost:8000/api/admin/pending-owners \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Approve Owner (Admin)
```bash
curl -X PUT http://localhost:8000/api/admin/approve-owner/OWNER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_uid": "RESTAURANT_UUID_FROM_DBA"
  }'
```

### Restaurant Owner Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "SecurePass123"
  }'
```

### Fetch Orders (Owner)
```bash
curl -X POST http://localhost:8000/api/owner/fetch-orders \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN"
```

---

## Troubleshooting

### "Module not found"
```bash
cd Backend
pip install -r requirements.txt
```

### "Connection refused"
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not, start it:
cd Backend
python main.py
```

### "Database connection failed"
```bash
# Verify .env credentials
cat ../.env

# Test connection
python -c "from database import get_dbb; print(get_dbb())"
```

### "Admin user already exists"
```bash
# Check Database B admin_users table
# Or delete existing admin and recreate
```

---

## File Locations

- **Environment Config**: `.env` (root directory)
- **Database Schema**: `setup_database_b.sql` (root directory)
- **Backend Code**: `Backend/` directory
- **API Documentation**: http://localhost:8000/docs (when running)
- **Setup Guide**: `SETUP_GUIDE.md`
- **Project Status**: `PROJECT_STATUS.md`

---

## Important URLs

- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc
- Frontend (once built): http://localhost:5173
- Supabase Dashboard: https://app.supabase.com

---

## Common Commands

```bash
# Check Python version
python --version

# Check installed packages
pip list

# Run backend with reload
cd Backend
uvicorn main:app --reload

# Check backend health
curl http://localhost:8000/health

# View backend logs (when running)
# Check terminal where you ran python main.py
```

---

**Quick Reference Version: 1.0**
