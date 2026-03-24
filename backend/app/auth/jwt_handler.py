"""
Production-grade JWT handler:
- Access tokens (short-lived, 60 min)
- Refresh tokens (long-lived, 7 days, stored in DB)
- Token revocation via DB blacklist (JTI)
- Account lockout after 5 failed attempts
- Constant-time password comparison
"""
import jwt
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.config import settings
from app.utils.logger import get_logger
from app.auth.password import verify_password, needs_rehash, hash_password

logger = get_logger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

MAX_FAILED_LOGINS = 5  # lockout threshold


# ── Pydantic models ──────────────────────────────────────
class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = "user"
    jti: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    role: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


# ── Token creation ────────────────────────────────────────
def create_access_token(username: str, role: str) -> tuple[str, str]:
    """Returns (token, jti). JTI is a unique token ID for revocation."""
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": username,
        "role": role,
        "jti": jti,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti


def create_refresh_token(username: str) -> tuple[str, str]:
    """Returns (token, token_hash). Hash is stored in DB."""
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {
        "sub": username,
        "jti": jti,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash


def _decode_token_raw(token: str) -> dict:
    """Decode JWT — raises HTTPException on failure."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired — please login again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── DB-backed authentication ──────────────────────────────
async def authenticate_user(username: str, password: str, db: AsyncSession):
    """
    Full DB-backed login:
    1. Fetch user from DB
    2. Check account is active and not locked
    3. Verify password with scrypt
    4. Track failed attempts — lock after MAX_FAILED_LOGINS
    5. Rehash password if using old scheme
    """
    from app.database.schemas import User

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(f"Login attempt for unknown user: {username!r}")
        return None

    if not user.is_active:
        logger.warning(f"Login attempt on deactivated account: {username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact administrator.",
        )

    if user.failed_logins >= MAX_FAILED_LOGINS:
        logger.warning(f"Account locked: {username} (failed={user.failed_logins})")
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked after {MAX_FAILED_LOGINS} failed attempts. Contact admin.",
        )

    if not verify_password(password, user.hashed_password):
        # Increment failed counter
        await db.execute(
            update(User)
            .where(User.id == user.id)
            .values(failed_logins=User.failed_logins + 1)
        )
        await db.commit()
        remaining = MAX_FAILED_LOGINS - (user.failed_logins + 1)
        logger.warning(f"Bad password for {username} — {remaining} attempts left")
        return None

    # Reset failed counter + update last login
    updates = {"failed_logins": 0, "last_login_at": datetime.now(timezone.utc)}

    # Auto-rehash if stored with old scheme
    if needs_rehash(user.hashed_password):
        updates["hashed_password"] = hash_password(password)
        logger.info(f"Password rehashed for {username}")

    await db.execute(update(User).where(User.id == user.id).values(**updates))
    await db.commit()
    await db.refresh(user)

    logger.info(f"Login success: {username} [{user.role}]")
    return user


# ── Token revocation ──────────────────────────────────────
async def revoke_token(jti: str, username: str, expires_at: datetime, db: AsyncSession):
    from app.database.schemas import RevokedToken
    revoked = RevokedToken(jti=jti, username=username, expires_at=expires_at)
    db.add(revoked)
    await db.commit()
    logger.info(f"Token revoked: jti={jti} user={username}")


async def is_token_revoked(jti: str, db: AsyncSession) -> bool:
    from app.database.schemas import RevokedToken
    result = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
    return result.scalar_one_or_none() is not None


# ── Refresh token storage ─────────────────────────────────
async def store_refresh_token(token_hash: str, username: str, db: AsyncSession):
    from app.database.schemas import RefreshToken
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    rt = RefreshToken(token_hash=token_hash, username=username, expires_at=expires)
    db.add(rt)
    await db.commit()


async def rotate_refresh_token(old_token: str, db: AsyncSession):
    """
    Refresh token rotation:
    1. Verify the old token
    2. Mark it as used (single-use)
    3. Issue a new access + refresh token pair
    Detects replay attacks — if token already used, revoke all tokens for user.
    """
    from app.database.schemas import RefreshToken, User

    payload = _decode_token_raw(old_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Not a refresh token")

    old_hash = hashlib.sha256(old_token.encode()).hexdigest()
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == old_hash))
    stored = result.scalar_one_or_none()

    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    if stored.is_used:
        # Replay detected — revoke ALL refresh tokens for this user
        logger.critical(f"REPLAY ATTACK detected for user: {stored.username}")
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.username == stored.username)
            .values(is_used=True)
        )
        await db.commit()
        raise HTTPException(status_code=401, detail="Token reuse detected — all sessions revoked")

    # Mark old token as used
    await db.execute(
        update(RefreshToken).where(RefreshToken.id == stored.id).values(is_used=True)
    )

    username = payload["sub"]
    user_result = await db.execute(select(User).where(User.username == username))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or disabled")

    new_access, new_jti = create_access_token(username, user.role)
    new_refresh, new_hash = create_refresh_token(username)
    await store_refresh_token(new_hash, username, db)
    await db.commit()

    return new_access, new_refresh


# ── FastAPI dependencies ──────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(None),  # injected at route level
) -> UserOut:
    raise NotImplementedError("Use get_current_user_db instead")


from app.database.db import get_db


async def get_current_user_db(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    from app.database.schemas import User

    payload = _decode_token_raw(token)

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Wrong token type")

    jti = payload.get("jti")
    if not jti:
        raise HTTPException(status_code=401, detail="Token missing JTI")

    # Check revocation list
    if await is_token_revoked(jti, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked — please login again",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or disabled")

    return UserOut(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        email=user.email,
    )


async def require_admin(
    current_user: UserOut = Depends(get_current_user_db),
) -> UserOut:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return current_user
