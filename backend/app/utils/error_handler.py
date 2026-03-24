"""
Global exception handler for JOBDETECT.

Catches ALL unhandled exceptions and returns structured JSON.
No internal details leak to the client — full details go to error.log.

Error response format (always consistent):
{
  "error": {
    "code":    "VALIDATION_ERROR",
    "message": "Human-readable message",
    "status":  422,
    "path":    "/api/jobs/classify",
    "request_id": "abc123"
  }
}
"""
import uuid
import traceback
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _error_body(code: str, message: str, status_code: int,
                path: str, request_id: str) -> dict:
    return {
        "error": {
            "code":       code,
            "message":    message,
            "status":     status_code,
            "path":       path,
            "request_id": request_id,
        }
    }


def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI app."""

    # ── 1. FastAPI / Starlette HTTP exceptions ────────────
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        rid = str(uuid.uuid4())[:8]
        path = request.url.path
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)

        if exc.status_code >= 500:
            logger.error(f"HTTP {exc.status_code} | {path} | rid={rid} | {detail}")
        elif exc.status_code >= 400:
            logger.warning(f"HTTP {exc.status_code} | {path} | rid={rid} | {detail}")

        code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            422: "UNPROCESSABLE",
            423: "LOCKED",
            429: "RATE_LIMITED",
            500: "INTERNAL_ERROR",
        }
        code = code_map.get(exc.status_code, f"HTTP_{exc.status_code}")

        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(code, detail, exc.status_code, path, rid),
            headers=getattr(exc, "headers", None) or {},
        )

    # ── 2. Pydantic validation errors (request body) ──────
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        rid = str(uuid.uuid4())[:8]
        path = request.url.path

        # Build human-readable field errors
        field_errors = []
        for err in exc.errors():
            field = " → ".join(str(x) for x in err.get("loc", []))
            msg   = err.get("msg", "invalid value")
            field_errors.append(f"{field}: {msg}")

        human_msg = "; ".join(field_errors) if field_errors else "Invalid request data"
        logger.warning(f"Validation error | {path} | rid={rid} | {human_msg}")

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code":       "VALIDATION_ERROR",
                    "message":    "Request validation failed",
                    "details":    field_errors,
                    "status":     422,
                    "path":       path,
                    "request_id": rid,
                }
            },
        )

    # ── 3. Database errors ────────────────────────────────
    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, exc: SQLAlchemyError):
        rid = str(uuid.uuid4())[:8]
        path = request.url.path
        # Log full details server-side, never expose to client
        logger.error(
            f"DB error | {path} | rid={rid} | "
            f"{type(exc).__name__}: {str(exc)[:300]}"
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=_error_body(
                "DATABASE_ERROR",
                "A database error occurred. Please try again.",
                503, path, rid,
            ),
        )

    # ── 4. Catch-all: unexpected exceptions ───────────────
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        rid = str(uuid.uuid4())[:8]
        path = request.url.path
        # Full traceback to error.log — NEVER to client
        logger.error(
            f"UNHANDLED EXCEPTION | {path} | rid={rid} | "
            f"{type(exc).__name__}: {str(exc)[:300]}\n"
            f"{traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body(
                "INTERNAL_ERROR",
                "An unexpected error occurred. Please try again.",
                500, path, rid,
            ),
        )
