from fastapi import APIRouter, HTTPException, status
from models.schemas import (
    RestaurantOwnerSignup,
    LoginRequest,
    TokenResponse,
    MessageResponse
)
from utils.auth import hash_password, verify_password, create_access_token
from database import get_dbb
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=MessageResponse)
async def signup(data: RestaurantOwnerSignup):
    """
    Restaurant owner signup endpoint
    Creates a new restaurant owner account with pending approval status
    """
    dbb = get_dbb()
    
    try:
        # Check if email already exists
        existing = dbb.table("restaurant_owners").select("id").eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = hash_password(data.password)
        
        # Insert new restaurant owner
        owner_result = dbb.table("restaurant_owners").insert({
            "email": data.email,
            "password_hash": password_hash,
            "full_name": data.full_name,
            "phone": data.phone,
            "restaurant_name": data.restaurant_name,
            "restaurant_address": data.restaurant_address,
            "restaurant_phone": data.restaurant_phone,
            "approval_status": "pending"
        }).execute()
        
        # Create restaurant_earnings_data entry with bank details
        if owner_result.data:
            restaurant_id = owner_result.data[0]["id"]
            has_bank_details = bool(
                data.bank_account_number or data.bank_ifsc_code or 
                data.bank_account_holder_name or data.upi_id
            )
            
            dbb.table("restaurant_earnings_data").insert({
                "restaurant_id": restaurant_id,
                "restaurant_name": data.restaurant_name,
                "restaurant_phone": data.restaurant_phone,
                "commission_rate": 0.20,  # Default 20% commission
                "has_bank_details": has_bank_details,
                "bank_account_number": data.bank_account_number,
                "bank_ifsc_code": data.bank_ifsc_code,
                "bank_account_holder_name": data.bank_account_holder_name,
                "upi_id": data.upi_id,
                "data_sent_by": data.email
            }).execute()
        
        return MessageResponse(
            success=True,
            message="Account created successfully! Please wait for admin approval."
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """
    Restaurant owner login endpoint
    Returns JWT token if credentials are valid and account is approved
    """
    dbb = get_dbb()
    
    try:
        # Find user by email
        result = dbb.table("restaurant_owners").select("*").eq("email", data.email).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user = result.data[0]
        
        # Verify password
        if not verify_password(data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check approval status
        if user["approval_status"] == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is under review. Please wait for admin approval."
            )
        
        if user["approval_status"] == "rejected":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account was rejected. Please contact support."
            )
        
        # Check if restaurant UID is assigned
        if user["approval_status"] == "approved" and not user["restaurant_uid"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin has approved your account but hasn't assigned a restaurant UID yet. Please wait."
            )
        
        # Generate JWT token
        token_data = {
            "sub": user["id"],
            "email": user["email"],
            "type": "restaurant_owner"
        }
        token = create_access_token(token_data)
        
        return TokenResponse(
            token=token,
            user_type="restaurant_owner",
            user_data={
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "restaurant_name": user["restaurant_name"],
                "restaurant_uid": user["restaurant_uid"]
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )
