from fastapi import APIRouter, HTTPException, status
from models.schemas import LoginRequest, TokenResponse
from utils.auth import verify_password, create_access_token
from database import get_dbb
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin Authentication"])

@router.post("/login", response_model=TokenResponse)
async def admin_login(data: LoginRequest):
    """
    Admin login endpoint
    Returns JWT token if admin credentials are valid
    """
    dbb = get_dbb()
    
    try:
        # Find admin by email
        result = dbb.table("admin_users").select("*").eq("email", data.email).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        admin = result.data[0]
        
        # Verify password
        if not verify_password(data.password, admin["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Update last login
        dbb.table("admin_users").update({
            "last_login": datetime.utcnow().isoformat()
        }).eq("id", admin["id"]).execute()
        
        # Generate JWT token
        token_data = {
            "sub": admin["id"],
            "email": admin["email"],
            "type": "admin"
        }
        token = create_access_token(token_data)
        
        return TokenResponse(
            token=token,
            user_type="admin",
            user_data={
                "id": admin["id"],
                "email": admin["email"],
                "full_name": admin["full_name"]
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )
