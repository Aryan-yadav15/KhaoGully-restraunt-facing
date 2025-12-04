# 🍽️ Restaurant Order Management System - Complete Setup Guide

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Python 3.8 or higher installed
- ✅ Node.js 16+ and npm installed
- ✅ Two Supabase projects ready:
  - Database A (DBA): Your existing production database with customer orders
  - Database B (DBB): New project for backend management
- ✅ Git (optional, for version control)

---

## 🗄️ Step 1: Database Setup

### 1.1 Create Database B (New Supabase Project)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Name it: "Restaurant-Management-Backend" (or any name you prefer)
4. Wait for the project to be created
5. Once ready, go to **Settings > API**
6. Copy these values (you'll need them later):
   - Project URL (SUPABASE_URL_DBB)
   - Service role key (SUPABASE_SERVICE_KEY_DBB)
   - Anon public key (SUPABASE_ANON_KEY_DBB)

### 1.2 Run Database B Schema

1. In your Database B project, go to **SQL Editor**
2. Click "New Query"
3. Open the file `setup_database_b.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see a success message
8. Verify tables were created by running:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```
9. You should see: `admin_users`, `restaurant_owners`, `fetched_orders`, `order_responses`

### 1.3 Get Database A Credentials

1. Go to your existing Database A project in Supabase
2. Go to **Settings > API**
3. Copy these values:
   - Project URL (SUPABASE_URL_DBA)
   - Service role key (SUPABASE_SERVICE_KEY_DBA)

---

## ⚙️ Step 2: Backend Setup

### 2.1 Install Python Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2.2 Configure Environment Variables

1. In the root directory (KhaoGully-Main), copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor and fill in your credentials:

```env
# Database B (Backend Management) - Full Access
SUPABASE_URL_DBB=https://your-project-dbb.supabase.co
SUPABASE_SERVICE_KEY_DBB=your_service_role_key_for_dbb_here
SUPABASE_ANON_KEY_DBB=your_anon_key_for_dbb_here

# Database A (Production Orders) - Read Only
SUPABASE_URL_DBA=https://your-project-dba.supabase.co
SUPABASE_SERVICE_KEY_DBA=your_service_role_key_for_dba_here

# JWT Secret (generate a random one)
JWT_SECRET_KEY=your_random_secret_key_min_32_chars_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Application Configuration
BACKEND_PORT=8000
FRONTEND_PORT=5173
ENVIRONMENT=development

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

3. Generate a secure JWT secret key:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   Copy the output and paste it as `JWT_SECRET_KEY` in your `.env` file.

### 2.3 Create Initial Admin User

```bash
cd Backend
python create_admin.py
```

**Important:** Edit `create_admin.py` before running to set your desired admin credentials!

Default credentials:
- Email: `admin@khaogully.com`
- Password: `Admin@123456`

**⚠️ Change the password after first login!**

### 2.4 Start Backend Server

```bash
python main.py
```

Or using uvicorn:
```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

### 2.5 Test Backend

Open your browser and visit:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

## 🎨 Step 3: Frontend Setup (Manual - Coming Soon)

The frontend is not yet implemented. To create it manually:

### 3.1 Initialize Vite Project

From the root directory (KhaoGully-Main):

```bash
npm create vite@latest Frontend -- --template react-ts
cd Frontend
npm install
```

### 3.2 Install Dependencies

```bash
npm install react-router-dom axios
npm install @types/react-router-dom --save-dev
```

### 3.3 Install Tailwind CSS (Optional)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3.4 Configure Tailwind

Edit `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Edit `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3.5 Start Frontend Development Server

```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

---

## 🧪 Step 4: Testing the Complete System

### 4.1 Test Admin Login

1. Go to http://localhost:5173/admin/login (once frontend is built)
2. Login with the admin credentials you created
3. You should see the admin dashboard

### 4.2 Test Restaurant Owner Signup

1. Go to http://localhost:5173/signup
2. Fill in the signup form with restaurant details
3. Submit the form
4. You should see a success message

### 4.3 Test Admin Approval

1. As admin, go to the pending owners list
2. You should see the newly signed up restaurant owner
3. Fetch restaurants from Database A
4. Assign a restaurant UID to the owner
5. Approve the owner

### 4.4 Test Restaurant Owner Login

1. Logout from admin
2. Go to http://localhost:5173/login
3. Login with the restaurant owner credentials
4. You should be redirected to the orders page

### 4.5 Test Order Fetching

1. As a restaurant owner, click "Check Orders"
2. Orders should be fetched from Database A
3. You should see:
   - Cumulative orders view (top section)
   - Individual orders view (bottom section)

### 4.6 Test Accept/Reject

1. For each item in cumulative view:
   - Click Accept to accept full quantity
   - Click Decline to partially/fully decline
2. Click "Confirm All Decisions"
3. Orders should be submitted and synced to Database A

---

## 📁 Final Project Structure

```
KhaoGully-Main/
├── .env                        # Your environment variables (DO NOT COMMIT)
├── .env.example               # Example env file
├── setup_database_b.sql       # Database B schema
├── Architecture_Prompt.md     # Complete architecture documentation
├── SETUP_GUIDE.md            # This file
├── FRONTEND_SETUP.md         # Frontend setup instructions
├── Backend/
│   ├── main.py               # FastAPI entry point
│   ├── config.py             # Configuration
│   ├── database.py           # Database connections
│   ├── create_admin.py       # Admin creation script
│   ├── requirements.txt      # Python dependencies
│   ├── README.md            # Backend documentation
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic models
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py          # Restaurant owner auth
│   │   ├── admin_auth.py    # Admin auth
│   │   ├── owner.py         # Owner endpoints
│   │   └── admin.py         # Admin endpoints
│   └── utils/
│       ├── __init__.py
│       ├── auth.py          # Auth utilities
│       └── dependencies.py  # FastAPI dependencies
└── Frontend/                # To be created
    ├── src/
    ├── public/
    └── package.json
```

---

## 🔧 Common Issues & Solutions

### Issue: "Module not found" errors

**Solution:**
```bash
cd Backend
pip install -r requirements.txt
```

### Issue: "Database connection failed"

**Solution:**
- Verify your Supabase URLs and keys in `.env`
- Check if the Supabase projects are active
- Ensure there are no trailing spaces in the `.env` values

### Issue: "Admin user already exists"

**Solution:**
- The admin user was already created
- You can login with the existing credentials
- Or delete the admin from Database B and run `create_admin.py` again

### Issue: Backend running on wrong port

**Solution:**
- Check `BACKEND_PORT` in `.env`
- Make sure port 8000 is not being used by another application

### Issue: CORS errors in browser

**Solution:**
- Verify `CORS_ORIGINS` in `.env` includes your frontend URL
- Restart the backend server after changing `.env`

---

## 🚀 Next Steps

1. ✅ Complete backend is ready and tested
2. ⏳ Build the frontend React application
3. ⏳ Test the complete end-to-end flow
4. ⏳ Deploy to production

---

## 📞 Support

For detailed architecture and implementation details, refer to:
- `Architecture_Prompt.md` - Complete system architecture
- `Backend/README.md` - Backend API documentation

---

## 🔒 Security Reminders

- ✅ Never commit `.env` file to version control
- ✅ Change default admin password after first login
- ✅ Use strong passwords for all accounts
- ✅ Keep your Supabase service role keys secure
- ✅ Use HTTPS in production
- ✅ Enable Row Level Security (RLS) in production

---

**Happy Coding! 🎉**
