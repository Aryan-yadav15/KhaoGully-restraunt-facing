"""
Test script to verify backend setup and database connections
"""
import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("="*60)
print("Testing Backend Setup")
print("="*60)

# Test 1: Import required modules
print("\n1. Testing imports...")
try:
    import fastapi
    import supabase
    import bcrypt
    import jwt
    from dotenv import load_dotenv
    print("   ✅ All packages imported successfully")
except ImportError as e:
    print(f"   ❌ Import failed: {e}")
    sys.exit(1)

# Test 2: Load environment variables
print("\n2. Testing environment variables...")
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

required_vars = [
    'SUPABASE_URL_DBB',
    'SUPABASE_SERVICE_KEY_DBB',
    'SUPABASE_URL_DBA',
    'SUPABASE_SERVICE_KEY_DBA',
    'JWT_SECRET_KEY'
]

missing_vars = []
for var in required_vars:
    if not os.getenv(var):
        missing_vars.append(var)

if missing_vars:
    print(f"   ❌ Missing environment variables: {', '.join(missing_vars)}")
    print("   Please check your .env file")
    sys.exit(1)
else:
    print("   ✅ All required environment variables found")

# Test 3: Test database connections
print("\n3. Testing database connections...")
try:
    from config import settings
    from database import get_dbb, get_dba
    
    print("   Testing Database B (Backend Management)...")
    dbb = get_dbb()
    # Try a simple query
    result = dbb.table('admin_users').select('id').limit(1).execute()
    print("   ✅ Database B connection successful")
except Exception as e:
    print(f"   ❌ Database B connection failed: {e}")
    print("   Make sure you've run setup_database_b.sql in Supabase")

try:
    print("   Testing Database A (Production Orders)...")
    dba = get_dba()
    # Try a simple query
    result = dba.table('restaurants').select('id').limit(1).execute()
    print("   ✅ Database A connection successful")
except Exception as e:
    print(f"   ❌ Database A connection failed: {e}")

# Test 4: Test authentication utilities
print("\n4. Testing authentication utilities...")
try:
    from utils.auth import hash_password, verify_password, create_access_token
    
    # Test password hashing
    test_password = "TestPassword123"
    hashed = hash_password(test_password)
    if verify_password(test_password, hashed):
        print("   ✅ Password hashing working correctly")
    else:
        print("   ❌ Password verification failed")
    
    # Test JWT token
    token = create_access_token({"sub": "test", "type": "test"})
    if token:
        print("   ✅ JWT token generation working")
    else:
        print("   ❌ JWT token generation failed")
except Exception as e:
    print(f"   ❌ Authentication utilities failed: {e}")

print("\n" + "="*60)
print("✅ Backend setup verification complete!")
print("="*60)
print("\nNext steps:")
print("1. Run: python create_admin.py (to create admin user)")
print("2. Run: python main.py (to start the backend server)")
print("3. Visit: http://localhost:8000/docs (to see API documentation)")
print("="*60)
