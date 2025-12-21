# Push Notifications Setup Guide

## Overview
When the webhook receives orders from external services, push notifications are automatically sent to restaurant owners on their mobile devices. The app will buzz continuously until the user opens and checks their pending orders.

## How It Works

### Backend Flow
1. **Webhook receives orders** → Inserts into `fetched_orders` table
2. **Fetches push token** → Retrieves owner's push token from `restaurant_owners` table
3. **Sends notification** → Uses Expo Push Notification service
4. **Owner's phone buzzes** → Native notification with sound + vibration

### Mobile App Flow
1. **User logs in** → App registers for push notifications
2. **Push token obtained** → Sent to backend and stored in database
3. **Notification received** → App shows alert, plays sound, vibrates
4. **User taps notification** → Opens app to orders screen
5. **User logs out** → Push token removed from backend

## Database Schema Update

Add these columns to the `restaurant_owners` table:

```sql
-- Add push notification token columns
ALTER TABLE restaurant_owners
ADD COLUMN push_token TEXT,
ADD COLUMN push_token_updated_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX idx_restaurant_owners_push_token ON restaurant_owners(push_token);
```

## Backend Setup

### 1. Install Dependencies
```bash
cd Backend
pip install -r requirements.txt
```

The `requests` package is now added to requirements.txt for sending notifications.

### 2. No Additional Configuration Required
The notification system uses Expo's free push notification service - no API keys needed!

## Mobile App Setup

### 1. Install Dependencies
Already installed: `expo-notifications`, `expo-device`

### 2. Update Project ID
In [notifications.ts](../ReactNativeApp/src/services/notifications.ts), the project ID is already set:
```typescript
projectId: '7d6eb5fd-7dad-4cbd-893a-19c8a9c77cac'
```

If you need to change it, get your project ID from:
```bash
npx expo config --type public | grep projectId
```

### 3. Test Notifications

#### On Physical Device (Required)
Push notifications **only work on physical devices**, not simulators/emulators.

1. Build and install on your device:
```bash
cd ReactNativeApp
npx expo start --tunnel
# Scan QR code with Expo Go app
```

2. Login to the app - push token automatically registers

3. Send a test order to the webhook endpoint

## Testing the Integration

### 1. Check Push Token Registration
After logging in, check the logs:
```
✅ Push token registered successfully
```

### 2. Trigger Webhook with Test Data
```bash
curl -X POST http://your-backend-url/api/webhook/receive-order \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test_123",
    "restaurant_id": "rest_001",
    "restaurant_phone": "+1234567890",
    "customer_name": "Test Customer",
    "customer_phone": "+9876543210",
    "items": [],
    "total_amount": 50000,
    "payment_status": "paid",
    "order_status": "pending"
  }'
```

### 3. Check Backend Logs
Look for:
```
📲 Sending push notification for order test_123
✅ Notification sent successfully
```

### 4. Check Mobile App
- Notification should appear
- Sound plays + vibration
- Badge count increases
- Tapping opens the app

## Notification Behavior

### When App is Closed
✅ Notification shows in system tray
✅ Sound plays
✅ Device vibrates 3 times
✅ Badge number updates

### When App is in Background
✅ Notification shows
✅ Sound plays
✅ Vibration
✅ Can tap to open app

### When App is Open (Foreground)
✅ In-app notification appears
✅ Sound plays
✅ Vibration
✅ No need to tap - already in app

## Notification Content

**Title:** 🔔 New Orders Received!

**Body:** {count} order(s) • ₹{amount}

**Example:** 
```
🔔 New Orders Received!
3 order(s) • ₹450.00
```

## Troubleshooting

### No Notification Received

1. **Check push token is registered:**
   - Query database: `SELECT push_token FROM restaurant_owners WHERE id = 'owner_id';`
   - Should show: `ExponentPushToken[xxxxxx]`

2. **Check backend logs:**
   - Look for "📲 Sending push notification"
   - Look for "✅ Notification sent successfully"

3. **Check permissions:**
   - Go to phone Settings → Apps → KhaoGully Restaurant → Notifications
   - Ensure notifications are enabled

4. **Check device:**
   - Must be a physical device (not simulator)
   - Must have internet connection

### Token Not Registering

1. **Check app.json:**
   - Ensure `expo-notifications` plugin is configured
   - Check `projectId` is set in `extra.eas`

2. **Reinstall app:**
   - Sometimes permissions need to be reset
   ```bash
   # Uninstall app from device
   # Rebuild and reinstall
   npx expo start --clear
   ```

### Notification Not Showing on Android

1. **Check notification channel:**
   - The app creates an "Orders" channel
   - Check phone Settings → Apps → Notifications → Categories

2. **Check Do Not Disturb:**
   - Ensure DND is off or app is allowed to override

## API Endpoints

### Register Push Token
```http
POST /api/owner/register-push-token
Content-Type: application/json
Authorization: Bearer {token}

{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxx]"
}
```

### Remove Push Token (Logout)
```http
DELETE /api/owner/remove-push-token
Authorization: Bearer {token}
```

## Production Deployment

### Backend
- No special configuration needed
- Expo Push Service is free for up to 1M notifications/month

### Mobile App
1. Build production APK/IPA
2. Test on real devices before releasing
3. Submit to Play Store / App Store

### Monitoring
- Check backend logs for notification delivery status
- Monitor Expo Push Notification status at: https://expo.dev/notifications

## Security Notes

- Push tokens are device-specific and tied to user sessions
- Tokens are removed on logout
- No sensitive data sent in notifications (only order count/amount)
- Expo manages token encryption and security

## Continuous Buzzing Feature

The notification is configured to:
- **Vibration Pattern:** [0, 250, 250, 250] = 3 vibrations
- **Sound:** Default system notification sound
- **Priority:** HIGH (Android) / Critical (iOS)

To make it buzz until checked:
- The notification stays in the system tray until dismissed
- User must either:
  - Tap the notification to open app
  - Or manually dismiss the notification
  - Or check orders in the app

The notification will **not** auto-dismiss until the user interacts with it.

## Future Enhancements

- [ ] Custom notification sounds
- [ ] Multiple vibration patterns
- [ ] Notification grouping (multiple orders)
- [ ] Silent hours configuration
- [ ] Per-restaurant notification preferences
- [ ] Rich notifications with order details
