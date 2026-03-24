import time
from fastapi import Request
from app.utils.logger import get_logger

logger = get_logger("access")


async def logging_middleware(request: Request, call_next):
    start = time.time()
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    method = request.method
    path = request.url.path

    try:
        response = await call_next(request)
        elapsed_ms = (time.time() - start) * 1000
        logger.info(
            f"{method} {path} | status={response.status_code} | "
            f"{elapsed_ms:.1f}ms | ip={ip}"
        )
        # Add security headers to every response
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response
    except Exception as exc:
        elapsed_ms = (time.time() - start) * 1000
        logger.error(
            f"{method} {path} | ERROR={type(exc).__name__} | "
            f"{elapsed_ms:.1f}ms | ip={ip} | detail={str(exc)[:200]}"
        )
        raise
