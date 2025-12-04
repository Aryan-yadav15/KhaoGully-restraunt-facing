from supabase import create_client, Client
from config import settings

# Database B (Backend Management) - Full Access
supabase_dbb: Client = create_client(
    settings.SUPABASE_URL_DBB,
    settings.SUPABASE_SERVICE_KEY_DBB
)

# Database A (Production Orders) - Read Only
supabase_dba: Client = create_client(
    settings.SUPABASE_URL_DBA,
    settings.SUPABASE_SERVICE_KEY_DBA
)

def get_dbb():
    """Get Database B client (Backend Management - Full Access)"""
    return supabase_dbb

def get_dba():
    """Get Database A client (Production Orders - Read Only)"""
    return supabase_dba
