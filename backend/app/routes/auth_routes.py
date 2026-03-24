"""
Authentication routes:
  POST /api/auth/register  — create new account
  POST /api/auth/login     — get access + refresh tokens
  POST /api/auth/refresh   — rotate tokens
  POST /api/auth/logout    — revoke current token
  GET  /api/auth/me        — current user info
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_handler import (
    authenticate_user, create_access_token, create_refresh_token,
    store_refresh_token, rotate_refresh_token,
    get_current_user_db, UserOut, _decode_token_raw,
)
from app.services.user_service import UserService, RegisterRequest, UserPublic
from app.database.db import get_db
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    expires_in:    int
    username:      str
    role:          str


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


# ── REGISTER ─────────────────────────────────────────────
@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user account.
    - Username must be unique, 3–30 chars, alphanumeric/_/-
    - Password strength validated (min 6 chars, not common)
    - Email optional but must be unique if provided
    - New accounts always get 'user' role (never 'admin')
    """
    svc = UserService(db)
    return await svc.register(req)


# ── LOGIN ─────────────────────────────────────────────────
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get JWT tokens",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns access token (60 min) + refresh token (7 days).
    Account is locked after 5 failed attempts.
    """
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token, _jti = create_access_token(user.username, user.role)
    refresh_token, rt_hash = create_refresh_token(user.username)
    await store_refresh_token(rt_hash, user.username, db)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        username=user.username,
        role=user.role,
    )


# ── REFRESH ───────────────────────────────────────────────
@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate access + refresh token pair",
)
async def refresh_tokens(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Single-use refresh token rotation.
    Replay detected → all sessions for user are revoked immediately.
    """
    try:
        new_access, new_refresh = await rotate_refresh_token(body.refresh_token, db)
        payload = _decode_token_raw(new_access)
        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            username=payload["sub"],
            role=payload.get("role", "user"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=401, detail="Token refresh failed")


# ── LOGOUT ────────────────────────────────────────────────
@router.post("/logout", summary="Logout current session")
async def logout(current_user: UserOut = Depends(get_current_user_db)):
    logger.info(f"Logout: {current_user.username}")
    return {"message": "Logged out successfully", "username": current_user.username}


# ── ME ────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut, summary="Get current user info")
async def get_me(current_user: UserOut = Depends(get_current_user_db)):
    return current_user
