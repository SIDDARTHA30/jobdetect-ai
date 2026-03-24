"""
User service — all DB operations for user management.
Handles registration, lookup, update, and account management.
"""
import re
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel, Field, field_validator, EmailStr
from app.database.schemas import User
from app.auth.password import hash_password, check_password_strength
from app.utils.logger import get_logger
from fastapi import HTTPException, status

logger = get_logger(__name__)

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_\-]{3,30}$")


# ── Pydantic schemas ──────────────────────────────────────
class RegisterRequest(BaseModel):
    username:   str  = Field(..., min_length=3, max_length=30)
    password:   str  = Field(..., min_length=6, max_length=128)
    full_name:  str  = Field(..., min_length=2, max_length=100)
    email:      Optional[str] = Field(None, max_length=200)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip().lower()
        if not USERNAME_RE.match(v):
            raise ValueError(
                "Username must be 3–30 characters: letters, numbers, _ or -"
            )
        reserved = {"admin", "root", "system", "superuser", "api", "null", "undefined"}
        if v in reserved:
            raise ValueError(f"Username '{v}' is reserved")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        ok, msg = check_password_strength(v)
        if not ok:
            raise ValueError(msg)
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        import re as _re
        v = _re.sub(r"<[^>]+>", "", v).strip()
        if not v:
            raise ValueError("Full name cannot be empty")
        return v


class UserPublic(BaseModel):
    id:         int
    username:   str
    full_name:  Optional[str]
    email:      Optional[str]
    role:       str
    is_active:  bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── User service ─────────────────────────────────────────
class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, req: RegisterRequest) -> UserPublic:
        """
        Register a new user.
        Checks uniqueness of username and email before creating.
        """
        # Check username taken
        existing = await self.db.execute(
            select(User).where(User.username == req.username)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Username '{req.username}' is already taken",
            )

        # Check email taken
        if req.email:
            email_check = await self.db.execute(
                select(User).where(User.email == req.email)
            )
            if email_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists",
                )

        user = User(
            username=req.username,
            hashed_password=hash_password(req.password),
            full_name=req.full_name,
            email=req.email,
            role="user",          # new users always get 'user' role
            is_active=True,
            failed_logins=0,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"New user registered: {user.username} | email={user.email}")
        return UserPublic.model_validate(user)

    async def get_by_username(self, username: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 50) -> list[UserPublic]:
        result = await self.db.execute(
            select(User).offset(skip).limit(limit).order_by(User.created_at.desc())
        )
        users = result.scalars().all()
        return [UserPublic.model_validate(u) for u in users]

    async def deactivate(self, username: str) -> bool:
        result = await self.db.execute(
            update(User)
            .where(User.username == username)
            .values(is_active=False)
        )
        await self.db.commit()
        return result.rowcount > 0
