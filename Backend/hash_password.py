"""
Simple Password Hasher
Generates a bcrypt hash that can be pasted directly into the database
"""
import bcrypt
import sys

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    return password_hash

if __name__ == "__main__":
    print("=" * 60)
    print("Password Hasher - Generate bcrypt hash for database")
    print("=" * 60)
    
    # Get password from command line or prompt
    if len(sys.argv) >= 2:
        password = sys.argv[1]
    else:
        password = input("\nEnter password to hash: ").strip()
    
    if not password:
        print("❌ Password cannot be empty")
        sys.exit(1)
    
    # Generate hash
    try:
        hashed = hash_password(password)
        
        print(f"\n✅ Password hashed successfully!")
        print(f"\nOriginal password: {password}")
        print(f"\n{'='*60}")
        print("Hashed password (copy this to paste in database):")
        print(f"{'='*60}")
        print(hashed)
        print(f"{'='*60}")
        print("\n💡 Copy the hash above and paste it into the 'password_hash' column")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)
