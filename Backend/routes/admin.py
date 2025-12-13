from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.schemas import (
    PendingOwner,
    Restaurant,
    ApproveOwnerRequest,
    MessageResponse
)
from utils.dependencies import get_current_admin
from database import get_dbb, get_dba
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin Management"])

@router.get("/pending-owners", response_model=List[PendingOwner])
async def get_pending_owners(current_admin: dict = Depends(get_current_admin)):
    """
    Get all restaurant owners with pending approval status
    """
    dbb = get_dbb()
    
    try:
        result = dbb.table("restaurant_owners").select("*").eq("approval_status", "pending").order("created_at").execute()
        
        return [
            PendingOwner(
                id=owner["id"],
                email=owner["email"],
                full_name=owner["full_name"],
                phone=owner["phone"],
                restaurant_name=owner["restaurant_name"],
                restaurant_address=owner["restaurant_address"],
                restaurant_phone=owner["restaurant_phone"],
                restaurant_email=owner.get("restaurant_email"),
                approval_status=owner["approval_status"],
                created_at=owner["created_at"]
            )
            for owner in result.data
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pending owners: {str(e)}"
        )

@router.get("/all-owners", response_model=List[PendingOwner])
async def get_all_owners(current_admin: dict = Depends(get_current_admin)):
    """
    Get all restaurant owners (pending, approved, rejected)
    """
    dbb = get_dbb()
    
    try:
        result = dbb.table("restaurant_owners").select("*").order("created_at").execute()
        
        return [
            PendingOwner(
                id=owner["id"],
                email=owner["email"],
                full_name=owner["full_name"],
                phone=owner["phone"],
                restaurant_name=owner["restaurant_name"],
                restaurant_address=owner["restaurant_address"],
                restaurant_phone=owner["restaurant_phone"],
                restaurant_email=owner.get("restaurant_email"),
                approval_status=owner["approval_status"],
                created_at=owner["created_at"]
            )
            for owner in result.data
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch owners: {str(e)}"
        )

@router.get("/all-restaurants", response_model=List[Restaurant])
async def get_all_restaurants(current_admin: dict = Depends(get_current_admin)):
    """
    Fetch all restaurants from Database A for UID assignment
    """
    dba = get_dba()
    
    try:
        result = dba.table("restaurants").select("id, name, address, phone").execute()
        
        return [
            Restaurant(
                id=restaurant["id"],
                name=restaurant["name"],
                address=restaurant.get("address"),
                phone=restaurant.get("phone")
            )
            for restaurant in result.data
        ]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch restaurants: {str(e)}"
        )

@router.put("/approve-owner/{owner_id}", response_model=MessageResponse)
async def approve_owner(
    owner_id: str,
    approve_data: ApproveOwnerRequest,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Approve a restaurant owner and assign restaurant UID
    """
    dbb = get_dbb()
    
    try:
        # Check if owner exists
        owner_result = dbb.table("restaurant_owners").select("*").eq("id", owner_id).execute()
        
        if not owner_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant owner not found"
            )
        
        # Update owner status and assign restaurant UID
        dbb.table("restaurant_owners").update({
            "approval_status": "approved",
            "restaurant_uid": approve_data.restaurant_uid,
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": current_admin["id"]
        }).eq("id", owner_id).execute()
        
        return MessageResponse(
            success=True,
            message="Restaurant owner approved and UID assigned successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve owner: {str(e)}"
        )

@router.put("/reject-owner/{owner_id}", response_model=MessageResponse)
async def reject_owner(
    owner_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Reject a restaurant owner's application
    """
    dbb = get_dbb()
    
    try:
        # Check if owner exists
        owner_result = dbb.table("restaurant_owners").select("*").eq("id", owner_id).execute()
        
        if not owner_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant owner not found"
            )
        
        # Update owner status to rejected
        dbb.table("restaurant_owners").update({
            "approval_status": "rejected"
        }).eq("id", owner_id).execute()
        
        return MessageResponse(
            success=True,
            message="Restaurant owner application rejected"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject owner: {str(e)}"
        )

@router.put("/assign-uid/{owner_id}", response_model=MessageResponse)
async def assign_restaurant_uid(
    owner_id: str,
    assign_data: ApproveOwnerRequest,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Assign or update restaurant UID for an approved owner
    """
    dbb = get_dbb()
    
    try:
        # Check if owner exists and is approved
        owner_result = dbb.table("restaurant_owners").select("*").eq("id", owner_id).execute()
        
        if not owner_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant owner not found"
            )
        
        owner = owner_result.data[0]
        
        if owner["approval_status"] != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only assign UID to approved owners"
            )
        
        # Update restaurant UID
        dbb.table("restaurant_owners").update({
            "restaurant_uid": assign_data.restaurant_uid
        }).eq("id", owner_id).execute()
        
        return MessageResponse(
            success=True,
            message="Restaurant UID assigned successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign UID: {str(e)}"
        )


