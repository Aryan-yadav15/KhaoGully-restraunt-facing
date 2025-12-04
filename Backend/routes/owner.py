from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.schemas import (
    OwnerStatusResponse,
    FetchOrdersResponse,
    CumulativeItem,
    IndividualOrder,
    OrderItem,
    SubmitOrderResponse,
    MessageResponse,
    EarningsSummary,
    OrderTransaction,
    EarningsTransactionsResponse,
    PendingEarnings,
    MonthlyEarnings
)
from utils.dependencies import get_current_user
from database import get_dbb, get_dba
from datetime import datetime

router = APIRouter(prefix="/api/owner", tags=["Restaurant Owner"])

@router.get("/status", response_model=OwnerStatusResponse)
async def get_owner_status(current_user: dict = Depends(get_current_user)):
    """
    Get current restaurant owner's status and restaurant UID
    """
    status_text = current_user["approval_status"]
    restaurant_uid = current_user.get("restaurant_uid")
    
    if status_text == "approved" and restaurant_uid:
        message = "Account approved and restaurant assigned"
    elif status_text == "approved" and not restaurant_uid:
        message = "Account approved, waiting for restaurant UID assignment"
    else:
        message = f"Account status: {status_text}"
    
    return OwnerStatusResponse(
        approval_status=status_text,
        restaurant_uid=restaurant_uid,
        restaurant_name=current_user["restaurant_name"],
        message=message
    )

@router.post("/fetch-orders", response_model=FetchOrdersResponse)
async def fetch_orders(current_user: dict = Depends(get_current_user)):
    """
    Fetch orders from Database B (fetched_orders table) for the restaurant owner
    Returns all orders from the current session (based on fetched_at timestamp)
    """
    dbb = get_dbb()
    
    try:
        # Fetch ALL orders from Database B (not just pending - we need to show accepted/rejected too)
        result = dbb.table("fetched_orders").select(
            "order_id, customer_name, customer_phone, items, total_amount, payment_status, order_status, created_at, fetched_at"
        ).eq("restaurant_owner_id", current_user["id"]).order("fetched_at", desc=True).execute()
        
        if not result.data:
            return FetchOrdersResponse(
                cumulative_orders=[],
                individual_orders=[]
            )
        
        # Get the most recent fetched_at timestamp
        latest_fetch_time = result.data[0]["fetched_at"]
        
        # Filter orders from the most recent batch only (same fetched_at time)
        orders = [order for order in result.data if order["fetched_at"] == latest_fetch_time]
        
        # Get responses for these orders
        order_ids = [order["order_id"] for order in orders]
        responses_result = dbb.table("order_responses").select(
            "order_id, overall_status"
        ).in_("order_id", order_ids).execute()
        
        # Create a map of order_id -> response status
        responses_map = {resp["order_id"]: resp["overall_status"] for resp in responses_result.data}
        
        # Process orders
        individual_orders = []
        cumulative_items = {}
        
        for order in orders:
            # Parse items
            order_items = []
            for item in order["items"]:
                order_item = OrderItem(
                    menu_item_id=item.get("menu_item_id", ""),
                    name=item.get("name", ""),
                    quantity=item.get("quantity", 0),
                    unit_price=item.get("unit_price", 0),
                    customizations=item.get("customizations"),
                    subtotal=item.get("subtotal", 0)
                )
                order_items.append(order_item)
                
                # Aggregate for cumulative view (all items, regardless of status)
                item_name = item.get("name", "")
                quantity = item.get("quantity", 0)
                
                if item_name in cumulative_items:
                    cumulative_items[item_name] += quantity
                else:
                    cumulative_items[item_name] = quantity
            
            # Check if this order has a response
            order_id = order["order_id"]
            has_response = order_id in responses_map
            response_status = responses_map.get(order_id, order["order_status"])
            
            # Create individual order
            individual_order = IndividualOrder(
                order_id=order_id,
                customer_name=order.get("customer_name", "Unknown"),
                customer_phone=order.get("customer_phone", "N/A"),
                items=order_items,
                total_amount=order["total_amount"],
                fetched_at=order.get("fetched_at"),
                order_status=response_status,
                responded=has_response
            )
            individual_orders.append(individual_order)
        
        # Create cumulative items list
        cumulative_orders = [
            CumulativeItem(item_name=name, total_quantity=qty)
            for name, qty in cumulative_items.items()
        ]
        
        return FetchOrdersResponse(
            cumulative_orders=cumulative_orders,
            individual_orders=individual_orders
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch orders: {str(e)}"
        )

@router.get("/order-history")
async def get_order_history(current_user: dict = Depends(get_current_user)):
    """
    Get order history for the restaurant owner - all orders from Database B
    """
    dbb = get_dbb()
    
    try:
        # Fetch all orders from Database B (fetched_orders table)
        result = dbb.table("fetched_orders").select(
            "order_id, customer_name, customer_phone, items, total_amount, payment_status, order_status, created_at"
        ).eq("restaurant_owner_id", current_user["id"]).order("created_at", desc=True).execute()
        
        if not result.data:
            return {"orders": [], "total_count": 0}
        
        orders = result.data
        history_orders = []
        
        for order in orders:
            # Get response details from Database B if exists
            response_result = dbb.table("order_responses").select(
                "overall_status, responded_at"
            ).eq("order_id", order["order_id"]).execute()
            
            response_data = None
            if response_result.data:
                response_data = response_result.data[0]
            
            history_orders.append({
                "order_id": order["order_id"],
                "customer_name": order.get("customer_name", "Unknown"),
                "customer_phone": order.get("customer_phone", "N/A"),
                "items": order["items"],
                "total_amount": order["total_amount"],
                "payment_status": order.get("payment_status"),
                "order_status": order.get("order_status"),
                "created_at": order.get("created_at"),
                "response": response_data
            })
        
        return {
            "orders": history_orders,
            "total_count": len(history_orders)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch order history: {str(e)}"
        )


@router.post("/submit-response", response_model=MessageResponse)
async def submit_order_response(
    response_data: SubmitOrderResponse,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit restaurant owner's accept/reject decision for a single order
    Updates order status in Database A and stores response in Database B
    """
    dbb = get_dbb()
    dba = get_dba()
    
    try:
        order_id = response_data.order_id
        decision = response_data.decision  # 'accepted' or 'rejected'
        
        if decision not in ['accepted', 'rejected']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Decision must be 'accepted' or 'rejected'"
            )
        
        # Check if response already exists for this order_id
        existing_response = dbb.table("order_responses").select("id").eq(
            "order_id", order_id
        ).execute()
        
        response_payload = {
            "restaurant_owner_id": current_user["id"],
            "order_id": order_id,
            "item_responses": [],  # Not used anymore, kept for schema compatibility
            "overall_status": decision,
            "synced_to_dba": True,
            "responded_at": "now()"
        }
        
        if existing_response.data:
            # Update existing response
            dbb.table("order_responses").update(response_payload).eq(
                "order_id", order_id
            ).execute()
        else:
            # Insert new response
            dbb.table("order_responses").insert(response_payload).execute()
        
        # Update order status in Database A
        dba.table("customer_orders").update({
            "status": decision
        }).eq("id", order_id).execute()
        
        # Update order status in Database B (fetched_orders)
        dbb.table("fetched_orders").update({
            "order_status": decision
        }).eq("order_id", order_id).execute()
        
        return MessageResponse(
            success=True,
            message=f"Order {decision} and synced successfully!"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit response: {str(e)}"
        )


# ============================================
# Earnings Endpoints
# ============================================

@router.get("/earnings-summary", response_model=EarningsSummary)
async def get_earnings_summary(current_user: dict = Depends(get_current_user)):
    """
    Get earnings summary for the restaurant owner
    """
    dbb = get_dbb()
    
    try:
        # Use restaurant_id directly from current_user (already contains the UUID)
        restaurant_id = current_user["id"]
        
        # Fetch earnings data
        result = dbb.table("restaurant_earnings_data").select("*").eq("restaurant_id", restaurant_id).execute()
        
        if not result.data:
            # Return default values if no earnings data exists yet
            return EarningsSummary(
                restaurant_id=restaurant_id,
                restaurant_name=current_user.get("restaurant_name", "Unknown"),
                restaurant_phone=current_user.get("restaurant_phone"),
                restaurant_email=current_user.get("restaurant_email"),
                total_lifetime_earnings=0.0,
                total_completed_orders=0,
                commission_rate=0.20,
                total_commission_paid=0.0,
                has_bank_details=False,
                bank_account_number=None,
                bank_ifsc_code=None,
                bank_account_holder_name=None,
                upi_id=None,
                last_synced_at=datetime.now(),
                data_sent_by=None,
                sync_status="pending"
            )
        
        earnings_data = result.data[0]
        
        return EarningsSummary(
            restaurant_id=earnings_data["restaurant_id"],
            restaurant_name=earnings_data["restaurant_name"],
            restaurant_phone=earnings_data.get("restaurant_phone"),
            restaurant_email=earnings_data.get("restaurant_email"),
            total_lifetime_earnings=float(earnings_data["total_lifetime_earnings"]),
            total_completed_orders=earnings_data["total_completed_orders"],
            commission_rate=float(earnings_data["commission_rate"]),
            total_commission_paid=float(earnings_data["total_commission_paid"]),
            has_bank_details=earnings_data["has_bank_details"],
            bank_account_number=earnings_data.get("bank_account_number"),
            bank_ifsc_code=earnings_data.get("bank_ifsc_code"),
            bank_account_holder_name=earnings_data.get("bank_account_holder_name"),
            upi_id=earnings_data.get("upi_id"),
            last_synced_at=earnings_data["last_synced_at"],
            data_sent_by=earnings_data.get("data_sent_by"),
            sync_status=earnings_data["sync_status"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch earnings summary: {str(e)}"
        )


@router.get("/earnings-transactions", response_model=EarningsTransactionsResponse)
async def get_earnings_transactions(
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
    is_paid: bool = None
):
    """
    Get transaction history for the restaurant owner with pagination
    """
    dbb = get_dbb()
    
    try:
        # Use restaurant_id directly from current_user
        restaurant_id = current_user["id"]
        
        # Build query
        query = dbb.table("restaurant_order_transactions").select("*").eq("restaurant_id", restaurant_id)
        
        # Filter by payment status if provided
        if is_paid is not None:
            query = query.eq("is_paid", is_paid)
        
        # Get total count
        count_result = query.execute()
        total_count = len(count_result.data) if count_result.data else 0
        
        # Fetch transactions with pagination
        result = query.order("order_date", desc=True).range(offset, offset + limit - 1).execute()
        
        transactions = []
        if result.data:
            for txn in result.data:
                transactions.append(OrderTransaction(
                    id=txn["id"],
                    transaction_id=txn["transaction_id"],
                    restaurant_id=txn["restaurant_id"],
                    order_id=txn["order_id"],
                    order_date=txn["order_date"],
                    customer_name=txn.get("customer_name"),
                    customer_phone=txn.get("customer_phone"),
                    delivery_address=txn.get("delivery_address"),
                    order_total=float(txn["order_total"]),
                    platform_commission=float(txn["platform_commission"]),
                    delivery_fee=float(txn["delivery_fee"]),
                    net_amount=float(txn["net_amount"]),
                    is_paid=txn["is_paid"],
                    paid_at=txn.get("paid_at"),
                    payout_cycle_id=txn.get("payout_cycle_id"),
                    payout_reference=txn.get("payout_reference"),
                    synced_at=txn["synced_at"]
                ))
        
        # Calculate pending earnings
        pending_result = dbb.table("restaurant_order_transactions").select(
            "net_amount"
        ).eq("restaurant_id", restaurant_id).eq("is_paid", False).execute()
        
        pending_amount = 0.0
        pending_orders = 0
        if pending_result.data:
            pending_amount = sum(float(item["net_amount"]) for item in pending_result.data)
            pending_orders = len(pending_result.data)
        
        return EarningsTransactionsResponse(
            transactions=transactions,
            total_count=total_count,
            pending_earnings=PendingEarnings(
                pending_amount=pending_amount,
                pending_orders=pending_orders
            )
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}"
        )


@router.get("/earnings-monthly", response_model=List[MonthlyEarnings])
async def get_monthly_earnings(current_user: dict = Depends(get_current_user)):
    """
    Get monthly earnings breakdown for the past 6 months
    """
    dbb = get_dbb()
    
    try:
        # Use restaurant_id directly from current_user
        restaurant_id = current_user["id"]
        
        # Fetch all transactions from the last 6 months
        result = dbb.table("restaurant_order_transactions").select(
            "order_date, order_total, platform_commission, net_amount"
        ).eq("restaurant_id", restaurant_id).gte(
            "order_date", datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ).execute()
        
        # Group by month
        monthly_data = {}
        if result.data:
            for txn in result.data:
                order_date = datetime.fromisoformat(txn["order_date"].replace("Z", "+00:00"))
                month_key = order_date.strftime("%Y-%m")
                
                if month_key not in monthly_data:
                    monthly_data[month_key] = {
                        "total_orders": 0,
                        "total_sales": 0.0,
                        "total_commission": 0.0,
                        "net_earnings": 0.0
                    }
                
                monthly_data[month_key]["total_orders"] += 1
                monthly_data[month_key]["total_sales"] += float(txn["order_total"])
                monthly_data[month_key]["total_commission"] += float(txn["platform_commission"])
                monthly_data[month_key]["net_earnings"] += float(txn["net_amount"])
        
        # Convert to list
        monthly_earnings = []
        for month, data in sorted(monthly_data.items(), reverse=True):
            monthly_earnings.append(MonthlyEarnings(
                month=month,
                total_orders=data["total_orders"],
                total_sales=data["total_sales"],
                total_commission=data["total_commission"],
                net_earnings=data["net_earnings"]
            ))
        
        return monthly_earnings
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch monthly earnings: {str(e)}"
        )
