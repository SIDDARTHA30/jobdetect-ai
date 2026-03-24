from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, Index
from sqlalchemy.sql import func
from app.database.db import Base


# ── USERS ─────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(50), unique=True, nullable=False, index=True)
    email         = Column(String(200), unique=True, nullable=True)
    hashed_password = Column(String(256), nullable=False)   # scrypt hash
    full_name     = Column(String(200), nullable=True)
    role          = Column(String(20), nullable=False, default="user")  # "admin" | "user"
    is_active     = Column(Boolean, default=True, nullable=False)
    failed_logins = Column(Integer, default=0, nullable=False)          # brute-force tracking
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())


# ── REVOKED TOKENS ────────────────────────────────────────
class RevokedToken(Base):
    """Token blacklist — stores JTI of revoked tokens."""
    __tablename__ = "revoked_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    jti        = Column(String(64), unique=True, nullable=False, index=True)
    username   = Column(String(50), nullable=False)
    revoked_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)


# ── REFRESH TOKENS ────────────────────────────────────────
class RefreshToken(Base):
    """Stored refresh tokens for multi-device session management."""
    __tablename__ = "refresh_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    username   = Column(String(50), nullable=False)
    is_used    = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)


# ── JOBS ──────────────────────────────────────────────────
class Job(Base):
    __tablename__ = "jobs"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(200), nullable=False)
    description  = Column(Text, nullable=False)
    company      = Column(String(200))
    location     = Column(String(200))
    salary_range = Column(String(100))
    requirements = Column(Text)
    created_by   = Column(String(50), nullable=True)   # username who submitted
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


# ── PREDICTIONS ───────────────────────────────────────────
class Prediction(Base):
    __tablename__ = "predictions"

    id                  = Column(Integer, primary_key=True, index=True)
    job_id              = Column(Integer, nullable=False)
    predicted_category  = Column(String(100), nullable=False)
    confidence          = Column(Float, nullable=False)
    all_scores          = Column(JSON)
    is_fraudulent       = Column(Boolean, default=False)
    fraud_probability   = Column(Float, default=0.0)
    processing_time_ms  = Column(Float)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
