from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    # connection pool hardening
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Create all tables and seed default users on first run."""
    from app.database.schemas import User, Job, Prediction, RevokedToken, RefreshToken
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables verified/created")
    await _seed_users()


async def _seed_users():
    """Create default admin and demo users if they don't exist."""
    from app.database.schemas import User
    from app.auth.password import hash_password
    from sqlalchemy import select

    default_users = [
        {"username": "admin", "password": "admin123", "role": "admin", "full_name": "JOBDETECT Admin", "email": "admin@jobdetect.local"},
        {"username": "demo",  "password": "demo123",  "role": "user",  "full_name": "Demo User",        "email": "demo@jobdetect.local"},
    ]

    async with AsyncSessionLocal() as session:
        for u in default_users:
            result = await session.execute(select(User).where(User.username == u["username"]))
            existing = result.scalar_one_or_none()
            if not existing:
                user = User(
                    username=u["username"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                    full_name=u["full_name"],
                    email=u["email"],
                    is_active=True,
                )
                session.add(user)
                logger.info(f"Seeded user: {u['username']} [{u['role']}]")
        await session.commit()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
