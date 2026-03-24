"""
JOBDETECT — Secure FastAPI Application
Version 4.0 — Production hardened with static file serving
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import os

from app.routes import job_routes, analysis_routes, health, auth_routes
from app.database.db import init_db
from app.ml.model_loader import load_model
from app.utils.logger import get_logger
from app.utils.error_handler import register_exception_handlers
from app.middleware.rate_limiter import rate_limit_middleware
from app.middleware.logging_middleware import logging_middleware
from app.config import settings

logger = get_logger(__name__)

# Path to the built React frontend
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("  JOBDETECT v4.0 — Secure AI Job Classifier")
    logger.info("=" * 60)
    logger.info("🚀 Initializing database...")
    await init_db()
    logger.info("🤖 Loading ML model...")
    load_model()
    logger.info(f"🌐 CORS origins: {settings.origins_list}")
    logger.info(f"🔒 Rate limits: {settings.RATE_LIMIT_PER_MINUTE}/min global, "
                f"{settings.CLASSIFY_RATE_LIMIT}/min classify")
    static_exists = os.path.isdir(STATIC_DIR)
    logger.info(f"📁 Static files: {'FOUND at ' + STATIC_DIR if static_exists else 'NOT FOUND — API-only mode'}")
    logger.info("✅ JOBDETECT is ONLINE and ready")
    yield
    logger.info("🔴 JOBDETECT shutting down...")


app = FastAPI(
    title="JOBDETECT — Secure AI API",
    description=(
        "AI-powered job posting classification with JWT authentication, "
        "rate limiting, scrypt password hashing, and full audit logging."
    ),
    version="4.0.0",
    lifespan=lifespan,
    docs_url="/api/docs"       if settings.DEBUG else None,
    redoc_url="/api/redoc"     if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
)

# ── 1. Global exception handlers (must be first) ──────────
register_exception_handlers(app)

# ── 2. Security middlewares (order matters — outer to inner) ──
app.add_middleware(BaseHTTPMiddleware, dispatch=logging_middleware)
app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

# ── 3. CORS ───────────────────────────────────────────────
# When serving frontend from the same origin, CORS is only needed
# for local dev. In production all requests come from same domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── 4. API Routes (registered BEFORE static files) ────────
app.include_router(health.router,          prefix="/api",          tags=["health"])
app.include_router(auth_routes.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(job_routes.router,      prefix="/api/jobs",     tags=["jobs"])
app.include_router(analysis_routes.router, prefix="/api/analysis", tags=["analysis"])

# ── 5. Serve React frontend static files ──────────────────
# Mount assets (JS/CSS/images) at /assets
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

# ── 6. Catch-all: serve index.html for ALL non-API routes ─
# This makes React Router work (landing page, login, dashboard etc.)
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    index = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index):
        return FileResponse(index)
    # Fallback if static not built yet (dev / API-only mode)
    return {
        "system":  "JOBDETECT",
        "version": "4.0.0",
        "status":  "ONLINE — frontend not built",
        "hint":    "Run: npm run build in /frontend, then copy dist/ to backend/app/static/",
    }
