from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel
from typing import List, Optional
from database import get_dbb
import os

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
    
    dbb = get_dbb()
    inserted_count = 0
    skipped_count = 0
    
    try:
        for order in payload.orders:
            # Check if order already exists (prevent duplicates)
            existing = dbb.table("fetched_orders").select("id").eq(
                "order_id", order.order_id
            ).execute()
            
            if existing.data:
                # Order already exists, skip
                skipped_count += 1
                continue
            
            # Find restaurant_owner_id by restaurant_phone
            restaurant_owner_id = None
            if order.restaurant_phone:
                owner_result = dbb.table("restaurant_owners").select("id").eq(
                    "restaurant_phone", order.restaurant_phone
                ).execute()
                
                if owner_result.data:
                    restaurant_owner_id = owner_result.data[0]["id"]
            
            # Insert order into fetched_orders
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
                "created_at": order.created_at
            }).execute()
            
            inserted_count += 1
        
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
        
        # Find restaurant_owner_id by restaurant_phone
        restaurant_owner_id = None
        if order.restaurant_phone:
            owner_result = dbb.table("restaurant_owners").select("id").eq(
                "restaurant_phone", order.restaurant_phone
            ).execute()
            
            if owner_result.data:
                restaurant_owner_id = owner_result.data[0]["id"]
        
        # Insert order
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
            "created_at": order.created_at
        }).execute()
        
        return {"success": True, "message": "Order inserted", "inserted": True}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to insert order: {str(e)}"
        )
