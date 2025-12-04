import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database B (Backend Management) - Full Access
    SUPABASE_URL_DBB: str = os.getenv("SUPABASE_URL_DBB", "")
    SUPABASE_SERVICE_KEY_DBB: str = os.getenv("SUPABASE_SERVICE_KEY_DBB", "")
    SUPABASE_ANON_KEY_DBB: str = os.getenv("SUPABASE_ANON_KEY_DBB", "")
    
    # Database A (Production Orders) - Read Only
    SUPABASE_URL_DBA: str = os.getenv("SUPABASE_URL_DBA", "")
    SUPABASE_SERVICE_KEY_DBA: str = os.getenv("SUPABASE_SERVICE_KEY_DBA", "")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Application Configuration
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS Configuration
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,https://3c4b0b7b5988.ngrok-free.app")
    
    class Config:
        env_file = ".env"

settings = Settings()
