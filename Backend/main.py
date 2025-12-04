from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import auth, admin_auth, owner, admin, webhook

# Create FastAPI app
app = FastAPI(
    title="Restaurant Order Management System",
    description="Backend API for restaurant order management with admin approval workflow",
    version="1.0.0"
)

# Configure CORS
origins = settings.CORS_ORIGINS.split(",")
print(f"CORS Origins: {origins}")  # Debug: show loaded origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(admin_auth.router)
app.include_router(owner.router)
app.include_router(admin.router)
app.include_router(webhook.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Restaurant Order Management System API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.BACKEND_PORT,
        reload=True if settings.ENVIRONMENT == "development" else False
    )
