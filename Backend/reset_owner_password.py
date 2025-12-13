"""
Reset Restaurant Owner Password
"""
import bcrypt
from database import get_dba
import sys

def reset_password(email: str, new_password: str):
    """Reset password for a restaurant owner"""
    dba = get_dba()
    
    try:
        # Check if owner exists
        result = dba.table("restaurant_owners").select("id, email, restaurant_name").eq("email", email).execute()
        
        if not result.data:
            print(f"❌ Error: No owner found with email: {email}")
            return False
        
        owner = result.data[0]
        print(f"\n✅ Found owner:")
        print(f"   Name: {owner.get('restaurant_name')}")
        print(f"   Email: {owner['email']}")
        
        # Hash the new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password
        update_result = dba.table("restaurant_owners").update({
            "password_hash": password_hash
        }).eq("email", email).execute()
        
        if update_result.data:
            print(f"\n✅ Password successfully reset!")
            print(f"   New password: {new_password}")
            print(f"   Email: {email}")
            return True
        else:
            print("❌ Failed to update password")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Restaurant Owner Password Reset")
    print("=" * 50)
    
    # Get email and new password
    if len(sys.argv) >= 3:
        email = sys.argv[1]
        new_password = sys.argv[2]
    else:
        email = input("\nEnter owner email: ").strip()
        new_password = input("Enter new password: ").strip()
    
    if not email or not new_password:
        print("❌ Email and password are required")
        sys.exit(1)
    
    # Confirm
    confirm = input(f"\n⚠️  Reset password for {email}? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("❌ Cancelled")
        sys.exit(0)
    
    # Reset password
    success = reset_password(email, new_password)
    sys.exit(0 if success else 1)
