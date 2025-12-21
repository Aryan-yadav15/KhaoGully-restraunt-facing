"""
Test script to send a test notification to a specific restaurant owner
"""
import sys
from database import get_dbb
from utils.notifications import send_new_orders_notification

def send_test_notification(phone: str):
    """Send a test notification to restaurant owner by phone"""
    dbb = get_dbb()
    
    # Get owner info
    result = dbb.table("restaurant_owners").select(
        "id, restaurant_name, push_token"
    ).eq("restaurant_phone", phone).execute()
    
    if not result.data:
        print(f"❌ No restaurant owner found with phone: {phone}")
        return
    
    owner = result.data[0]
    
    if not owner.get("push_token"):
        print(f"❌ {owner['restaurant_name']} has no push token registered")
        print("   Please login to the app first to register the token")
        return
    
    print(f"\n📲 Sending test notification to {owner['restaurant_name']}...")
    print(f"   Push Token: {owner['push_token'][:50]}...\n")
    
    # Send test notification
    result = send_new_orders_notification(
        push_tokens=[owner["push_token"]],
        orders_count=2,
        total_amount=45000,  # ₹450.00 in paise
        restaurant_phone=phone
    )
    
    if result["success"]:
        print("✅ Test notification sent successfully!")
        print(f"   Response: {result['data']}")
    else:
        print(f"❌ Failed to send notification: {result.get('error')}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_send_notification.py <restaurant_phone>")
        print("Example: python test_send_notification.py +919668235566")
        sys.exit(1)
    
    phone = sys.argv[1]
    send_test_notification(phone)
