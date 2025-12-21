"""
Quick test script to check if push tokens are registered
"""
from database import get_dbb
import json

def check_push_tokens():
    dbb = get_dbb()
    result = dbb.table("restaurant_owners").select(
        "id, restaurant_phone, restaurant_name, push_token"
    ).execute()
    
    print("\n" + "="*80)
    print("PUSH TOKEN STATUS")
    print("="*80 + "\n")
    
    registered = 0
    not_registered = 0
    
    for owner in result.data:
        if owner.get("push_token"):
            registered += 1
            print(f"✅ {owner['restaurant_name']} ({owner['restaurant_phone']})")
            print(f"   Token: {owner['push_token'][:50]}...")
        else:
            not_registered += 1
            print(f"❌ {owner['restaurant_name']} ({owner['restaurant_phone']}) - NO TOKEN")
    
    print("\n" + "="*80)
    print(f"Summary: {registered} registered, {not_registered} not registered")
    print("="*80 + "\n")

if __name__ == "__main__":
    check_push_tokens()
