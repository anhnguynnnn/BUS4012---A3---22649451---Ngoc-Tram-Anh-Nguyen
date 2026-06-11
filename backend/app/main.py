from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGIN, print_settings_summary
from app.models import AuthResponse, HealthResponse, LoginRequest, SignUpRequest
from app.supabase_auth import login as supabase_login
from app.supabase_auth import signup as supabase_signup


# This FastAPI app is intentionally minimal for Phase 1 of MUSÉ.
# It supports authentication only and delegates user management to Supabase Auth.
print_settings_summary()

app = FastAPI(title="MUSÉ Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    print("[MUSÉ Backend] API ready at http://localhost:8000")
    print("[MUSÉ Backend] Health check: http://localhost:8000/health")


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/auth/signup")
async def signup(request: SignUpRequest) -> dict:
    """Sign up a MUSÉ user through Supabase Auth.

    Supabase may require email confirmation depending on your project settings.
    No posts, albums, or onboarding database logic is implemented in Phase 1.
    """
    return await supabase_signup(
        email=str(request.email),
        password=request.password,
        full_name=request.full_name,
    )


@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest) -> dict:
    """Log in a MUSÉ user and return Supabase Auth tokens plus the user object."""
    return await supabase_login(email=str(request.email), password=request.password)