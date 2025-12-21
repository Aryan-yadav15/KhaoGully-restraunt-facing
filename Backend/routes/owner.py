from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
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
    MonthlyEarnings,
    UpdateBankDetailsRequest,
    ProfileData
)
from utils.dependencies import get_current_user
from database import get_dbb, get_dba
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

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
    dba = get_dba()
    
    try:
        logger.info(
            "📦 Fetch orders called: owner_id=%s restaurant_phone=%s restaurant_uid=%s",
            current_user.get("id"),
            current_user.get("restaurant_phone"),
            current_user.get("restaurant_uid"),
        )
        # Fetch only active orders (not yet sent for delivery)
        result = dbb.table("fetched_orders").select(
            "order_id, customer_name, customer_phone, items, subtotal, total_amount, payment_status, order_status, created_at, fetched_at"
        ).eq("restaurant_owner_id", current_user["id"]).eq("sent_for_delivery", False).order("fetched_at", desc=True).execute()

        logger.info(
            "📦 fetched_orders query result: owner_id=%s count=%s",
            current_user.get("id"),
            len(result.data) if result.data else 0,
        )
        
        if not result.data:
            return FetchOrdersResponse(
                cumulative_orders=[],
                individual_orders=[]
            )
        
        # Auto-reject any pending orders that have been pending for more than 10 minutes
        from datetime import datetime, timedelta, timezone
        current_time = datetime.now(timezone.utc)
        auto_reject_threshold = timedelta(minutes=10)
        
        for order in result.data:
            fetched_at = order.get("fetched_at")
            if fetched_at:
                try:
                    # Parse the fetched_at timestamp
                    fetched_time = datetime.fromisoformat(fetched_at.replace('Z', '+00:00'))
                    time_elapsed = current_time - fetched_time
                    
                    # Check if order has been pending for more than 10 minutes
                    if time_elapsed > auto_reject_threshold:
                        order_id = order["order_id"]
                        
                        # Check if this order already has a response
                        existing_response = dbb.table("order_responses").select("order_id").eq("order_id", order_id).execute()
                        
                        if not existing_response.data:
                            # No response yet - auto-reject it
                            # Insert auto-rejection response
                            dbb.table("order_responses").insert({
                                "restaurant_owner_id": current_user["id"],
                                "order_id": order_id,
                                "overall_status": "auto_rejected",
                                "synced_to_dba": True
                            }).execute()
                            
                            # Update order status in Database A
                            try:
                                dba.table("customer_orders").update({
                                    "status": "auto_rejected"
                                }).eq("id", order_id).execute()
                            except:
                                pass  # Continue even if DBA update fails
                            
                            # Update order status in Database B
                            dbb.table("fetched_orders").update({
                                "order_status": "auto_rejected"
                            }).eq("order_id", order_id).execute()
                            
                            # Update the order in result.data to reflect the auto-rejection
                            order["order_status"] = "auto_rejected"
                except Exception as e:
                    # Log error but continue processing other orders
                    print(f"Error auto-rejecting order {order.get('order_id')}: {str(e)}")
                    pass
        
        # Get all orders (not just from the latest batch)
        orders = result.data
        
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
                total_amount=order.get("subtotal") or order["total_amount"],  # Use subtotal (what restaurant receives), fallback to total_amount for old data
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
            "order_id, customer_name, customer_phone, items, subtotal, total_amount, payment_status, order_status, created_at"
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
                "total_amount": order.get("subtotal") or order["total_amount"],  # Use subtotal (what restaurant receives), fallback to total_amount for old data
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


@router.post("/auto-reject-pending", response_model=MessageResponse)
async def auto_reject_pending(current_user: dict = Depends(get_current_user)):
    """
    Auto-reject all pending orders (not yet accepted/rejected) for the current user
    This is triggered after 10 minutes from when orders were fetched
    """
    dbb = get_dbb()
    dba = get_dba()
    
    try:
        # Get all active orders that haven't been sent for delivery yet
        active_orders = dbb.table("fetched_orders").select(
            "order_id"
        ).eq("restaurant_owner_id", current_user["id"]).eq("sent_for_delivery", False).execute()
        
        if not active_orders.data:
            return MessageResponse(
                success=True,
                message="No active orders to process"
            )
        
        order_ids = [order["order_id"] for order in active_orders.data]
        
        # Check which orders don't have responses yet
        existing_responses = dbb.table("order_responses").select(
            "order_id"
        ).in_("order_id", order_ids).execute()
        
        responded_order_ids = {resp["order_id"] for resp in existing_responses.data} if existing_responses.data else set()
        pending_order_ids = [oid for oid in order_ids if oid not in responded_order_ids]
        
        # Auto-reject only the pending orders
        auto_rejected_count = 0
        if pending_order_ids:
            for order_id in pending_order_ids:
                # Insert auto-rejection response
                dbb.table("order_responses").insert({
                    "restaurant_owner_id": current_user["id"],
                    "order_id": order_id,
                    "overall_status": "auto_rejected",
                    "synced_to_dba": True
                }).execute()
                
                # Update order status in Database A
                try:
                    dba.table("customer_orders").update({
                        "status": "auto_rejected"
                    }).eq("id", order_id).execute()
                except:
                    pass  # Continue even if DBA update fails
                
                # Update order status in Database B
                dbb.table("fetched_orders").update({
                    "order_status": "auto_rejected"
                }).eq("order_id", order_id).execute()
                
                auto_rejected_count += 1
        
        message = f"Auto-rejected {auto_rejected_count} pending order(s)"
        
        return MessageResponse(
            success=True,
            message=message
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to auto-reject pending orders: {str(e)}"
        )


@router.post("/mark-orders-sent", response_model=MessageResponse)
async def mark_orders_sent(current_user: dict = Depends(get_current_user)):
    """
    Mark all active orders (not yet sent for delivery) as sent_for_delivery = TRUE
    Auto-reject any pending orders that haven't been accepted/rejected
    This is used when owner clicks "Mark as Sent" or when 30-minute timer expires
    """
    dbb = get_dbb()
    dba = get_dba()
    
    try:
        # First, get all orders that are about to be marked as sent
        active_orders = dbb.table("fetched_orders").select(
            "order_id"
        ).eq("restaurant_owner_id", current_user["id"]).eq("sent_for_delivery", False).execute()
        
        if not active_orders.data:
            return MessageResponse(
                success=True,
                message="No active orders to mark as sent"
            )
        
        order_ids = [order["order_id"] for order in active_orders.data]
        
        # Check which orders don't have responses yet
        existing_responses = dbb.table("order_responses").select(
            "order_id"
        ).in_("order_id", order_ids).execute()
        
        responded_order_ids = {resp["order_id"] for resp in existing_responses.data} if existing_responses.data else set()
        pending_order_ids = [oid for oid in order_ids if oid not in responded_order_ids]
        
        # Auto-reject pending orders
        auto_rejected_count = 0
        if pending_order_ids:
            for order_id in pending_order_ids:
                # Insert auto-rejection response
                dbb.table("order_responses").insert({
                    "restaurant_owner_id": current_user["id"],
                    "order_id": order_id,
                    "overall_status": "auto_rejected",
                    "synced_to_dba": True
                }).execute()
                
                # Update order status in Database A
                try:
                    dba.table("customer_orders").update({
                        "status": "auto_rejected"
                    }).eq("id", order_id).execute()
                except:
                    pass  # Continue even if DBA update fails
                
                # Update order status in Database B
                dbb.table("fetched_orders").update({
                    "order_status": "auto_rejected"
                }).eq("order_id", order_id).execute()
                
                auto_rejected_count += 1
        
        # Now mark all orders as sent for delivery
        result = dbb.table("fetched_orders").update({
            "sent_for_delivery": True
        }).eq("restaurant_owner_id", current_user["id"]).eq("sent_for_delivery", False).execute()
        
        updated_count = len(result.data) if result.data else 0
        
        message = f"Marked {updated_count} order(s) as sent for delivery"
        if auto_rejected_count > 0:
            message += f" ({auto_rejected_count} pending order(s) auto-rejected)"
        
        return MessageResponse(
            success=True,
            message=message
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark orders as sent: {str(e)}"
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
        
        # Fetch earnings data (including commission_rate)
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
                commission_rate=0.20,  # Default commission rate
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
        
        # Get commission rate from restaurant_earnings_data
        earnings_result = dbb.table("restaurant_earnings_data").select("commission_rate, pending_earnings").eq("restaurant_id", restaurant_id).execute()
        commission_rate = 0.20  # Default
        pending_amount = 0.0
        if earnings_result.data:
            commission_rate = float(earnings_result.data[0]["commission_rate"])
            pending_amount = float(earnings_result.data[0]["pending_earnings"])
        
        # Fetch orders from fetched_orders
        query = dbb.table("fetched_orders").select("*").eq("restaurant_owner_id", restaurant_id)
        
        # Get total count
        count_result = query.execute()
        total_count = len(count_result.data) if count_result.data else 0
        
        # Fetch orders with pagination
        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        # Get order IDs to fetch responses
        order_ids = [order["order_id"] for order in result.data] if result.data else []
        
        # Fetch order responses for these orders
        responses_map = {}
        if order_ids:
            responses_result = dbb.table("order_responses").select("order_id, overall_status, responded_at").in_("order_id", order_ids).execute()
            if responses_result.data:
                responses_map = {resp["order_id"]: resp for resp in responses_result.data}
        
        transactions = []
        pending_orders = 0
        if result.data:
            for order in result.data:
                # Convert amount from paise to rupees
                # Use subtotal (what restaurant receives) instead of total_amount
                order_subtotal = order.get("subtotal") or order["total_amount"]
                order_total = float(order_subtotal) / 100.0
                platform_commission = order_total * commission_rate
                delivery_fee = 0.0  # No delivery fee data in fetched_orders
                net_amount = order_total - platform_commission
                
                # Get order status from order_responses if available
                order_response = responses_map.get(order["order_id"])
                overall_status = order_response.get("overall_status") if order_response else None
                
                # Determine if paid (check if order is accepted and completed)
                # For now, treat accepted orders as pending payment
                is_paid = False  # Will be updated when actual payment system is integrated
                if not is_paid:
                    pending_orders += 1
                
                transactions.append(OrderTransaction(
                    id=str(order["id"]),
                    transaction_id=str(order["order_id"]),
                    restaurant_id=restaurant_id,
                    order_id=str(order["order_id"]),
                    order_date=order.get("created_at", order["fetched_at"]),
                    customer_name=order.get("customer_name"),
                    customer_phone=order.get("customer_phone"),
                    delivery_address=None,  # Not available in fetched_orders
                    order_total=order_total,
                    platform_commission=platform_commission,
                    delivery_fee=delivery_fee,
                    net_amount=net_amount,
                    is_paid=is_paid,
                    paid_at=None if not is_paid else order.get("created_at"),
                    payout_cycle_id=None,
                    payout_reference=None,
                    synced_at=order["fetched_at"]
                ))
        
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
        
        # Get commission rate from restaurant_earnings_data
        earnings_result = dbb.table("restaurant_earnings_data").select("commission_rate").eq("restaurant_id", restaurant_id).execute()
        commission_rate = 0.20  # Default
        if earnings_result.data:
            commission_rate = float(earnings_result.data[0]["commission_rate"])
        
        # Fetch all orders from the last 6 months
        six_months_ago = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = dbb.table("fetched_orders").select(
            "created_at, subtotal, total_amount, order_status"
        ).eq("restaurant_owner_id", restaurant_id).gte(
            "created_at", six_months_ago.isoformat()
        ).execute()
        
        # Group by month
        monthly_data = {}
        if result.data:
            for order in result.data:
                order_date = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00"))
                month_key = order_date.strftime("%Y-%m")
                
                if month_key not in monthly_data:
                    monthly_data[month_key] = {
                        "total_orders": 0,
                        "total_sales": 0.0,
                        "total_commission": 0.0,
                        "net_earnings": 0.0
                    }
                
                # Convert from paise to rupees
                # Use subtotal (what restaurant receives) instead of total_amount
                order_subtotal = order.get("subtotal") or order["total_amount"]
                order_total = float(order_subtotal) / 100.0
                platform_commission = order_total * commission_rate
                net_amount = order_total - platform_commission
                
                monthly_data[month_key]["total_orders"] += 1
                monthly_data[month_key]["total_sales"] += order_total
                monthly_data[month_key]["total_commission"] += platform_commission
                monthly_data[month_key]["net_earnings"] += net_amount
        
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

@router.get("/profile", response_model=ProfileData)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get complete profile data including bank details
    """
    dbb = get_dbb()
    
    try:
        restaurant_id = current_user["id"]
        
        # Fetch bank details from restaurant_earnings_data
        earnings_result = dbb.table("restaurant_earnings_data").select(
            "bank_account_number, bank_ifsc_code, bank_account_holder_name, upi_id"
        ).eq("restaurant_id", restaurant_id).execute()
        
        # Get bank details if they exist
        bank_details = {}
        if earnings_result.data:
            bank_details = {
                "bank_account_number": earnings_result.data[0].get("bank_account_number"),
                "bank_ifsc_code": earnings_result.data[0].get("bank_ifsc_code"),
                "bank_account_holder_name": earnings_result.data[0].get("bank_account_holder_name"),
                "upi_id": earnings_result.data[0].get("upi_id")
            }
        
        return ProfileData(
            full_name=current_user["full_name"],
            email=current_user["email"],
            phone=current_user["phone"],
            restaurant_name=current_user["restaurant_name"],
            restaurant_address=current_user["restaurant_address"],
            restaurant_phone=current_user["restaurant_phone"],
            restaurant_email=current_user.get("restaurant_email"),
            bank_account_number=bank_details.get("bank_account_number"),
            bank_ifsc_code=bank_details.get("bank_ifsc_code"),
            bank_account_holder_name=bank_details.get("bank_account_holder_name"),
            upi_id=bank_details.get("upi_id")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}"
        )

@router.put("/update-bank-details", response_model=MessageResponse)
async def update_bank_details(
    bank_data: UpdateBankDetailsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update bank details in restaurant_earnings_data
    """
    dbb = get_dbb()
    
    try:
        restaurant_id = current_user["id"]
        
        # Check if restaurant_earnings_data entry exists
        result = dbb.table("restaurant_earnings_data").select("id").eq("restaurant_id", restaurant_id).execute()
        
        has_bank_details = bool(
            bank_data.bank_account_number or bank_data.bank_ifsc_code or 
            bank_data.bank_account_holder_name or bank_data.upi_id
        )
        
        update_data = {
            "bank_account_number": bank_data.bank_account_number,
            "bank_ifsc_code": bank_data.bank_ifsc_code,
            "bank_account_holder_name": bank_data.bank_account_holder_name,
            "upi_id": bank_data.upi_id,
            "has_bank_details": has_bank_details,
            "data_sent_by": current_user["email"]
        }
        
        if result.data:
            # Update existing record
            dbb.table("restaurant_earnings_data").update(update_data).eq("restaurant_id", restaurant_id).execute()
        else:
            # Create new record if it doesn't exist
            update_data.update({
                "restaurant_id": restaurant_id,
                "restaurant_name": current_user["restaurant_name"],
                "restaurant_phone": current_user["restaurant_phone"],
                "restaurant_email": current_user.get("restaurant_email"),
                "commission_rate": 0.20  # Default 20% commission
            })
            dbb.table("restaurant_earnings_data").insert(update_data).execute()
        
        return MessageResponse(
            success=True,
            message="Bank details updated successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update bank details: {str(e)}"
        )


class PushTokenRequest(BaseModel):
    push_token: str

@router.post("/register-push-token", response_model=MessageResponse)
async def register_push_token(
    request: PushTokenRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Register or update Expo push notification token for the restaurant owner
    """
    dbb = get_dbb()
    
    try:
        # Validate token format
        if not request.push_token or not (request.push_token.startswith("ExponentPushToken[") or request.push_token.startswith("ExpoPushToken[")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid push token format"
            )
        
        token_preview = request.push_token[:25] + "..."
        logger.info(f"📲 Register push token: owner_id={current_user['id']} token_preview={token_preview}")

        # Update push token in restaurant_owners table
        dbb.table("restaurant_owners").update({
            "push_token": request.push_token,
            "push_token_updated_at": datetime.now().isoformat()
        }).eq("id", current_user["id"]).execute()
        
        return MessageResponse(
            success=True,
            message="Push token registered successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register push token: {str(e)}"
        )


@router.delete("/remove-push-token", response_model=MessageResponse)
async def remove_push_token(current_user: dict = Depends(get_current_user)):
    """
    Remove push notification token (called on logout)
    """
    dbb = get_dbb()
    
    try:
        logger.info(f"🧹 Remove push token: owner_id={current_user['id']}")
        dbb.table("restaurant_owners").update({
            "push_token": None,
            "push_token_updated_at": None
        }).eq("id", current_user["id"]).execute()
        
        return MessageResponse(
            success=True,
            message="Push token removed successfully"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove push token: {str(e)}"
        )
