from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel
from typing import List, Optional
from database import get_dbb
from utils.notifications import send_new_orders_notification
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhook", tags=["Webhook"])

# ---------------------------------------------------
# Pydantic Models for Webhook
# ---------------------------------------------------
class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    unit_price: Optional[int] = 0
    customizations: Optional[str] = None
    subtotal: Optional[int] = 0

class IncomingOrder(BaseModel):
    order_id: str
    restaurant_id: str
    restaurant_phone: Optional[str] = None
    customer_name: str
    customer_phone: str
    items: List[dict]  # Raw items from DBA
    total_amount: int
    payment_status: str
    order_status: str
    created_at: Optional[str] = None
    pool_id: Optional[str] = None
    # New amount breakdown fields (all in paise)
    subtotal: Optional[int] = None
    delivery_fee: Optional[int] = None
    platform_fee: Optional[int] = None
    total_customer_paid: Optional[int] = None
    amount_to_collect: Optional[int] = None

class WebhookPayload(BaseModel):
    orders: List[IncomingOrder]
    api_key: Optional[str] = None

class WebhookResponse(BaseModel):
    success: bool
    message: str
    inserted_count: int
    skipped_count: int

# ---------------------------------------------------
# Webhook Endpoint to Receive Orders
# ---------------------------------------------------
@router.post("/receive-orders", response_model=WebhookResponse)
async def receive_orders(
    payload: WebhookPayload,
    x_api_key: Optional[str] = Header(None)
):
    """
    Webhook endpoint to receive orders from external scripts (e.g., fetchCumSend.py)
    Orders are inserted into fetched_orders table, duplicates are skipped.
    """
    # Optional: API key validation
    expected_api_key = os.getenv("WEBHOOK_API_KEY")
    if expected_api_key:
        provided_key = x_api_key or payload.api_key
        if provided_key != expected_api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
    
    logger.info(f"📥 Webhook /receive-orders hit: orders={len(payload.orders)}")
    dbb = get_dbb()
    inserted_count = 0
    skipped_count = 0
    
    # Track orders by restaurant owner for notifications
    owner_orders = {}  # {owner_id: {"orders": [], "total": 0, "phone": "", "push_token": ""}}
    
    try:
        for order in payload.orders:
            logger.info(
                f"➡️ Processing order_id={order.order_id} restaurant_phone={order.restaurant_phone} total_amount={order.total_amount}"
            )
            # Check if order already exists (prevent duplicates)
            existing = dbb.table("fetched_orders").select("id").eq(
                "order_id", order.order_id
            ).execute()
            
            if existing.data:
                # Order already exists, skip
                logger.info(f"⏭️ Skipping duplicate order_id={order.order_id}")
                skipped_count += 1
                continue
            
            # Find restaurant_owner_id by restaurant_uid OR restaurant_phone (fallback)
            restaurant_owner_id = None
            push_token = None
            lookup_method = None
            
            # Try 1: lookup by restaurant_uid (primary - synced with external service)
            if order.restaurant_id:
                owner_result = dbb.table("restaurant_owners").select("id, push_token").eq(
                    "restaurant_uid", order.restaurant_id
                ).execute()
                
                if owner_result.data:
                    restaurant_owner_id = owner_result.data[0]["id"]
                    push_token = owner_result.data[0].get("push_token")
                    lookup_method = "restaurant_uid"
            
            # Try 2: fallback to restaurant_phone
            if not restaurant_owner_id and order.restaurant_phone:
                owner_result = dbb.table("restaurant_owners").select("id, push_token").eq(
                    "restaurant_phone", order.restaurant_phone
                ).execute()
                
                if owner_result.data:
                    restaurant_owner_id = owner_result.data[0]["id"]
                    push_token = owner_result.data[0].get("push_token")
                    lookup_method = "restaurant_phone"
            
            # Log result
            if restaurant_owner_id:
                token_preview = (push_token[:25] + "...") if push_token else None
                logger.info(
                    f"👤 Owner lookup ok (via {lookup_method}): owner_id={restaurant_owner_id} push_token={'set' if push_token else 'missing'} preview={token_preview}"
                )
            else:
                logger.warning(
                    f"⚠️ Owner lookup failed: restaurant_phone={order.restaurant_phone} restaurant_id={order.restaurant_id} (no matching restaurant_owners row)"
                )
            
            # Insert order into fetched_orders
            logger.debug(
                f"🧾 Amount breakdown order_id={order.order_id} subtotal={order.subtotal} delivery_fee={order.delivery_fee} "
                f"platform_fee={order.platform_fee} total_customer_paid={order.total_customer_paid} amount_to_collect={order.amount_to_collect}"
            )
            
            dbb.table("fetched_orders").insert({
                "restaurant_owner_id": restaurant_owner_id,
                "order_id": order.order_id,
                "customer_name": order.customer_name,
                "customer_phone": order.customer_phone,
                "restaurant_phone": order.restaurant_phone,
                "items": order.items,
                "total_amount": order.total_amount,
                "payment_status": order.payment_status,
                "order_status": order.order_status,
                "created_at": order.created_at,
                "pool_id": order.pool_id,
                "subtotal": order.subtotal,
                "delivery_fee": order.delivery_fee,
                "platform_fee": order.platform_fee,
                "total_customer_paid": order.total_customer_paid,
                "amount_to_collect": order.amount_to_collect
            }).execute()
            
            inserted_count += 1
            logger.info(f"✅ Inserted order_id={order.order_id} (inserted_count={inserted_count})")
            
            # Debug: Log notification tracking decision
            logger.debug(
                f"🔔 Notification tracking: restaurant_owner_id={'set' if restaurant_owner_id else 'missing'} "
                f"push_token={'set' if push_token else 'missing'}"
            )
            
            # Track order for push notification
            if restaurant_owner_id and push_token:
                if restaurant_owner_id not in owner_orders:
                    # Get restaurant_phone from database if not in order payload
                    phone = order.restaurant_phone
                    if not phone:
                        owner_phone_result = dbb.table("restaurant_owners").select("restaurant_phone").eq(
                            "id", restaurant_owner_id
                        ).execute()
                        if owner_phone_result.data:
                            phone = owner_phone_result.data[0].get("restaurant_phone")
                    
                    owner_orders[restaurant_owner_id] = {
                        "orders": [],
                        "total": 0,
                        "phone": phone,
                        "push_token": push_token
                    }
                owner_orders[restaurant_owner_id]["orders"].append(order.order_id)
                owner_orders[restaurant_owner_id]["total"] += order.total_amount
            elif restaurant_owner_id and not push_token:
                logger.warning(f"⚠️ Owner has no push_token: owner_id={restaurant_owner_id} order_id={order.order_id}")
        
        # Send push notifications to restaurant owners
        for owner_id, data in owner_orders.items():
            try:
                token_preview = (data["push_token"][:25] + "...") if data.get("push_token") else None
                logger.info(
                    f"📲 Sending push notification: owner_id={owner_id} orders={len(data['orders'])} total_amount={data['total']} token_preview={token_preview}"
                )
                notification_result = send_new_orders_notification(
                    push_tokens=[data["push_token"]],
                    orders_count=len(data["orders"]),
                    total_amount=data["total"],
                    restaurant_phone=data["phone"]
                )
                if notification_result["success"]:
                    logger.info(f"✅ Notification sent successfully to owner {owner_id}")
                else:
                    logger.error(f"❌ Failed to send notification to owner {owner_id}: {notification_result.get('error')}")
            except Exception as e:
                logger.error(f"❌ Exception sending notification to owner {owner_id}: {str(e)}")

        logger.info(
            f"🏁 Webhook /receive-orders complete: total={len(payload.orders)} inserted={inserted_count} skipped={skipped_count} notified_owners={len(owner_orders)}"
        )
        
        return WebhookResponse(
            success=True,
            message=f"Processed {len(payload.orders)} orders",
            inserted_count=inserted_count,
            skipped_count=skipped_count
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process orders: {str(e)}"
        )


# ---------------------------------------------------
# Single Order Endpoint (Alternative)
# ---------------------------------------------------
@router.post("/receive-order")
async def receive_single_order(
    order: IncomingOrder,
    x_api_key: Optional[str] = Header(None)
):
    """
    Webhook endpoint to receive a single order.
    Useful if sending orders one by one.
    """
    # Optional: API key validation
    expected_api_key = os.getenv("WEBHOOK_API_KEY")
    if expected_api_key and x_api_key != expected_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    dbb = get_dbb()
    
    try:
        # Check if order already exists
        existing = dbb.table("fetched_orders").select("id").eq(
            "order_id", order.order_id
        ).execute()
        
        if existing.data:
            return {"success": True, "message": "Order already exists", "inserted": False}
        
        # Find restaurant_owner_id by restaurant_uid (primary) or restaurant_phone (fallback)
        restaurant_owner_id = None
        push_token = None
        
        # Try 1: lookup by restaurant_uid (primary - synced with external service)
        if order.restaurant_id:
            owner_result = dbb.table("restaurant_owners").select("id, push_token").eq(
                "restaurant_uid", order.restaurant_id
            ).execute()
            
            if owner_result.data:
                restaurant_owner_id = owner_result.data[0]["id"]
                push_token = owner_result.data[0].get("push_token")
        
        # Try 2: fallback to restaurant_phone if uid lookup failed
        if not restaurant_owner_id and order.restaurant_phone:
            owner_result = dbb.table("restaurant_owners").select("id, push_token").eq(
                "restaurant_phone", order.restaurant_phone
            ).execute()
            
            if owner_result.data:
                restaurant_owner_id = owner_result.data[0]["id"]
                push_token = owner_result.data[0].get("push_token")
        
        # Insert order
        # Debug: Log what we're receiving
        print(f"📥 Inserting single order {order.order_id}:")
        print(f"   subtotal: {order.subtotal}")
        print(f"   delivery_fee: {order.delivery_fee}")
        print(f"   platform_fee: {order.platform_fee}")
        print(f"   total_customer_paid: {order.total_customer_paid}")
        print(f"   amount_to_collect: {order.amount_to_collect}")
        
        dbb.table("fetched_orders").insert({
            "restaurant_owner_id": restaurant_owner_id,
            "order_id": order.order_id,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "restaurant_phone": order.restaurant_phone,
            "items": order.items,
            "total_amount": order.total_amount,
            "payment_status": order.payment_status,
            "order_status": order.order_status,
            "created_at": order.created_at,
            "pool_id": order.pool_id,
            "subtotal": order.subtotal,
            "delivery_fee": order.delivery_fee,
            "platform_fee": order.platform_fee,
            "total_customer_paid": order.total_customer_paid,
            "amount_to_collect": order.amount_to_collect
        }).execute()
        
        # Send push notification if token exists
        if push_token:
            try:
                logger.info(f"📲 Sending push notification for order {order.order_id}")
                notification_result = send_new_orders_notification(
                    push_tokens=[push_token],
                    orders_count=1,
                    total_amount=order.total_amount,
                    restaurant_phone=order.restaurant_phone
                )
                if notification_result["success"]:
                    logger.info(f"✅ Notification sent successfully for order {order.order_id}")
                else:
                    logger.error(f"❌ Failed to send notification: {notification_result.get('error')}")
            except Exception as e:
                logger.error(f"❌ Exception sending notification: {str(e)}")
        
        return {"success": True, "message": "Order inserted", "inserted": True}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to insert order: {str(e)}"
        )
