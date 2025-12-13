from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# ============================================
# Authentication Schemas
# ============================================

class RestaurantOwnerSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: str
    restaurant_name: str
    restaurant_address: str
    restaurant_phone: str
    restaurant_email: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = None
    bank_account_holder_name: Optional[str] = None
    upi_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user_type: str
    user_data: dict

# ============================================
# Restaurant Owner Schemas
# ============================================

class RestaurantOwnerResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    restaurant_name: str
    restaurant_address: str
    restaurant_phone: str
    restaurant_email: Optional[str]
    restaurant_uid: Optional[str]
    approval_status: str
    created_at: datetime

class OwnerStatusResponse(BaseModel):
    approval_status: str
    restaurant_uid: Optional[str]
    restaurant_name: str
    message: str

# ============================================
# Order Schemas
# ============================================

class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    unit_price: int
    customizations: Optional[str] = None
    subtotal: int

class IndividualOrder(BaseModel):
    order_id: str
    customer_name: str
    customer_phone: str
    items: List[OrderItem]
    total_amount: int
    fetched_at: Optional[datetime] = None
    order_status: str = "pending"  # pending, accepted, rejected
    responded: bool = False  # True if owner has responded

class CumulativeItem(BaseModel):
    item_name: str
    total_quantity: int

class FetchOrdersResponse(BaseModel):
    cumulative_orders: List[CumulativeItem]
    individual_orders: List[IndividualOrder]

class SubmitOrderResponse(BaseModel):
    order_id: str
    decision: str  # 'accepted' or 'rejected'

# ============================================
# Admin Schemas
# ============================================

class PendingOwner(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    restaurant_name: str
    restaurant_address: str
    restaurant_phone: str
    restaurant_email: Optional[str]
    approval_status: str
    created_at: datetime

class Restaurant(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class ApproveOwnerRequest(BaseModel):
    restaurant_uid: str

class MessageResponse(BaseModel):
    success: bool
    message: str

# ============================================
# Earnings Schemas
# ============================================

class EarningsSummary(BaseModel):
    restaurant_id: str
    restaurant_name: str
    restaurant_phone: Optional[str]
    restaurant_email: Optional[str]
    total_lifetime_earnings: float
    total_completed_orders: int
    commission_rate: float
    total_commission_paid: float
    has_bank_details: bool
    bank_account_number: Optional[str]
    bank_ifsc_code: Optional[str]
    bank_account_holder_name: Optional[str]
    upi_id: Optional[str]
    last_synced_at: datetime
    data_sent_by: Optional[str]
    sync_status: str

class OrderTransaction(BaseModel):
    id: str
    transaction_id: str
    restaurant_id: str
    order_id: str
    order_date: datetime
    customer_name: Optional[str]
    customer_phone: Optional[str]
    delivery_address: Optional[str]
    order_total: float
    platform_commission: float
    delivery_fee: float
    net_amount: float
    is_paid: bool
    paid_at: Optional[datetime]
    payout_cycle_id: Optional[int]
    payout_reference: Optional[str]
    synced_at: datetime

class PendingEarnings(BaseModel):
    pending_amount: float
    pending_orders: int

class MonthlyEarnings(BaseModel):
    month: str
    total_orders: int
    total_sales: float
    total_commission: float
    net_earnings: float

class EarningsTransactionsResponse(BaseModel):
    transactions: List[OrderTransaction]
    total_count: int
    pending_earnings: PendingEarnings

class UpdateBankDetailsRequest(BaseModel):
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = None
    bank_account_holder_name: Optional[str] = None
    upi_id: Optional[str] = None

class ProfileData(BaseModel):
    full_name: str
    email: str
    phone: str
    restaurant_name: str
    restaurant_address: str
    restaurant_phone: str
    restaurant_email: Optional[str]
    bank_account_number: Optional[str]
    bank_ifsc_code: Optional[str]
    bank_account_holder_name: Optional[str]
    upi_id: Optional[str]

