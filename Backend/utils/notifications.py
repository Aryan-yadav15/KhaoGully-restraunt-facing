"""
Push notification utilities for sending notifications via Expo Push Notification service.
"""
import requests
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

def send_push_notification(
    push_tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict] = None,
    sound: str = "default",
    priority: str = "high",
    channel_id: str = "orders",
    critical: bool = False
) -> Dict:
    """
    Send push notification via Expo Push Notification service.
    
    Args:
        push_tokens: List of Expo push tokens (format: ExponentPushToken[...])
        title: Notification title
        body: Notification body/message
        data: Optional data payload to send with notification
        sound: Notification sound (default, null, or custom sound file)
        priority: 'default', 'normal', 'high'
        channel_id: Android notification channel ID
        critical: If True, sends as critical alert (bypasses Do Not Disturb)
    
    Returns:
        Dict with success status and response data
    """
    if not push_tokens:
        logger.warning("No push tokens provided")
        return {"success": False, "error": "No push tokens"}
    
    # Filter out invalid tokens
    valid_tokens = [
        token for token in push_tokens 
        if token and (token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken["))
    ]
    
    if not valid_tokens:
        logger.warning("No valid Expo push tokens found")
        return {"success": False, "error": "No valid push tokens"}

    token_previews = [(t[:25] + "...") for t in valid_tokens]
    logger.info(f"📤 Sending Expo push: devices={len(valid_tokens)} tokens={token_previews}")
    
    # Prepare notification messages
    messages = []
    for token in valid_tokens:
        message = {
            "to": token,
            "title": title,
            "body": body,
            "sound": sound,
            "priority": priority,
            "channelId": channel_id,
            "badge": 1,
            # Longer vibration pattern for urgent notifications
            "vibrate": [0, 500, 500, 500, 500, 500],
        }
        
        # Add critical/interruption level for iOS
        if critical:
            message["categoryId"] = "NEW_ORDER_CRITICAL"
            message["interruptionLevel"] = "critical"
        
        if data:
            message["data"] = data
            
        messages.append(message)
    
    try:
        response = requests.post(
            EXPO_PUSH_URL,
            json=messages,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=10
        )
        
        response.raise_for_status()
        result = response.json()

        # Expo typically returns a list of ticket objects
        logger.info(f"✅ Expo push accepted: devices={len(valid_tokens)}")
        logger.debug(f"Expo response: {result}")
        return {"success": True, "data": result}
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send push notification: {str(e)}")
        return {"success": False, "error": str(e)}


def send_new_orders_notification(
    push_tokens: List[str],
    orders_count: int,
    total_amount: int,
    restaurant_phone: str
) -> Dict:
    """
    Send notification for new orders received.
    
    Args:
        push_tokens: List of Expo push tokens
        orders_count: Number of new orders
        total_amount: Total amount in paise
        restaurant_phone: Restaurant phone number
    
    Returns:
        Dict with success status
    """
    # Convert paise to rupees
    amount_rupees = total_amount / 100
    
    title = f"🔔 New Orders Received!"
    body = f"{orders_count} order(s) • ₹{amount_rupees:.2f}"
    
    data = {
        "type": "new_orders",
        "orders_count": orders_count,
        "total_amount": total_amount,
        "restaurant_phone": restaurant_phone,
        "action": "open_orders"
    }
    
    return send_push_notification(
        push_tokens=push_tokens,
        title=title,
        body=body,
        data=data,
        sound="default",
        priority="high",
        channel_id="orders",
        critical=True  # Mark as critical for urgent delivery
    )
