from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGIN, print_settings_summary
from app.models import HealthResponse
from app.routers.auth import router as auth_router
from app.routers.interactions import router as interactions_router
from app.routers.posts import router as posts_router
from app.routers.recommendations import router as recommendations_router


# This FastAPI app is intentionally minimal for Phase 1 of MUSÉ.
# It supports authentication only and delegates user management to Supabase Auth.
print_settings_summary()

app = FastAPI(title="MUSÉ Backend", version="0.1.0")

# Allow both common Vite dev-server ports so CORS works regardless of which
# port Vite picks (5173 is default, 5174 is the fallback when 5173 is busy).
ALLOWED_ORIGINS = list(set([
    FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All Supabase Auth operations are proxied through this router so the frontend
# never needs direct Supabase credentials beyond user session tokens.
app.include_router(auth_router)
app.include_router(interactions_router)
app.include_router(posts_router)
app.include_router(recommendations_router)


@app.on_event("startup")
async def startup_event() -> None:
    print("[MUSÉ Backend] API ready at http://localhost:8000")
    print("[MUSÉ Backend] Health check: http://localhost:8000/health")


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")
