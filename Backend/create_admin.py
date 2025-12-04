"""
Create Initial Admin User Script
Run this script once to create the first admin account in Database B

Usage:
    python create_admin.py

You can modify the admin credentials in this script before running.
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client
import bcrypt

# Load environment variables
load_dotenv()

def create_admin():
    """Create initial admin user in Database B"""
    
    # Get Database B credentials
    SUPABASE_URL_DBB = os.getenv("SUPABASE_URL_DBB")
    SUPABASE_SERVICE_KEY_DBB = os.getenv("SUPABASE_SERVICE_KEY_DBB")
    
    if not SUPABASE_URL_DBB or not SUPABASE_SERVICE_KEY_DBB:
        print("❌ ERROR: Database B credentials not found in .env file")
        print("Please make sure SUPABASE_URL_DBB and SUPABASE_SERVICE_KEY_DBB are set")
        sys.exit(1)
    
    # Create Supabase client
    try:
        supabase_dbb = create_client(SUPABASE_URL_DBB, SUPABASE_SERVICE_KEY_DBB)
        print("✅ Connected to Database B")
    except Exception as e:
        print(f"❌ Failed to connect to Database B: {str(e)}")
        sys.exit(1)
    
    # Admin credentials - CHANGE THESE BEFORE RUNNING!
    ADMIN_EMAIL = "admin@khaogully.com"
    ADMIN_PASSWORD = "Admin@123456"  # CHANGE THIS!
    ADMIN_NAME = "System Administrator"
    
    print("\n" + "="*50)
    print("Creating Admin User")
    print("="*50)
    print(f"Email: {ADMIN_EMAIL}")
    print(f"Password: {ADMIN_PASSWORD}")
    print(f"Name: {ADMIN_NAME}")
    print("="*50)
    print("\n⚠️  WARNING: Please change the default password after first login!")
    print()
    
    # Confirm creation
    confirm = input("Do you want to create this admin user? (yes/no): ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print("❌ Admin creation cancelled")
        sys.exit(0)
    
    try:
        # Check if admin with this email already exists
        result = supabase_dbb.table('admin_users').select('id').eq('email', ADMIN_EMAIL).execute()
        
        if result.data:
            print(f"\n❌ Admin user with email {ADMIN_EMAIL} already exists!")
            sys.exit(1)
        
        # Hash password
        password_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert admin user
        result = supabase_dbb.table('admin_users').insert({
            'email': ADMIN_EMAIL,
            'password_hash': password_hash,
            'full_name': ADMIN_NAME
        }).execute()
        
        if result.data:
            print("\n✅ Admin user created successfully!")
            print(f"   ID: {result.data[0]['id']}")
            print(f"   Email: {ADMIN_EMAIL}")
            print(f"   Password: {ADMIN_PASSWORD}")
            print("\n⚠️  IMPORTANT: Change the password after first login!")
            print(f"\nYou can now login at: http://localhost:{os.getenv('FRONTEND_PORT', '5173')}/admin/login")
        else:
            print("\n❌ Failed to create admin user - no data returned")
            sys.exit(1)
    
    except Exception as e:
        print(f"\n❌ Failed to create admin user: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    create_admin()
