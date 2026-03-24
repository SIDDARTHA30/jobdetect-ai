"""
Per-IP in-memory rate limiter using sliding window algorithm.

Limits:
  - Global:   RATE_LIMIT_PER_MINUTE  (default 30) req/min per IP
  - Classify: CLASSIFY_RATE_LIMIT    (default 10) req/min per IP
  - Login:    5 req/min per IP  (brute-force protection)

The sliding window is more accurate than fixed windows because it
doesn't reset all counts at once (which attackers can exploit).

Thread-safe: asyncio is single-threaded so deque ops are atomic.
"""
import time
from collections import defaultdict, deque
from fastapi import Request, HTTPException, status
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# {store_key: {ip: deque[timestamp]}}
_stores: dict[str, dict[str, deque]] = {
    "global":   defaultdict(deque),
    "classify": defaultdict(deque),
    "login":    defaultdict(deque),
}

_LIMITS = {
    "global":   (settings.RATE_LIMIT_PER_MINUTE, 60),
    "classify": (settings.CLASSIFY_RATE_LIMIT,   60),
    "login":    (5,                               60),  # hardcoded — always strict
}


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting common reverse proxy headers."""
    for header in ("X-Real-IP", "X-Forwarded-For", "CF-Connecting-IP"):
        value = request.headers.get(header)
        if value:
            return value.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


def _sliding_window_check(store_key: str, ip: str) -> tuple[bool, int]:
    """
    Sliding window rate check.
    Returns (allowed, remaining_requests).
    Removes timestamps outside the window first (true sliding window).
    """
    limit, window_secs = _LIMITS[store_key]
    now = time.monotonic()
    q = _stores[store_key][ip]

    # Evict expired entries
    while q and now - q[0] > window_secs:
        q.popleft()

    remaining = max(0, limit - len(q))
    if len(q) >= limit:
        return False, 0

    q.append(now)
    return True, remaining - 1


async def rate_limit_middleware(request: Request, call_next):
    """Global + endpoint-specific rate limiting middleware."""
    ip = _get_client_ip(request)
    path = request.method + " " + request.url.path

    # Global limit
    allowed, remaining = _sliding_window_check("global", ip)
    if not allowed:
        logger.warning(f"RATE LIMIT [global] ip={ip} path={path}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {settings.RATE_LIMIT_PER_MINUTE} requests/min. Slow down.",
            headers={"Retry-After": "60"},
        )

    # Login-specific limit
    if request.url.path.endswith("/auth/login") and request.method == "POST":
        allowed, _ = _sliding_window_check("login", ip)
        if not allowed:
            logger.warning(f"RATE LIMIT [login] ip={ip} — possible brute force")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Wait 60 seconds.",
                headers={"Retry-After": "60"},
            )

    # Classify-specific limit
    if request.url.path.endswith("/jobs/classify") and request.method == "POST":
        allowed, _ = _sliding_window_check("classify", ip)
        if not allowed:
            logger.warning(f"RATE LIMIT [classify] ip={ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many classification requests. Limit: {settings.CLASSIFY_RATE_LIMIT}/min.",
                headers={"Retry-After": "60"},
            )

    response = await call_next(request)
    # Expose remaining quota in headers
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response


def classify_rate_limit(request: Request):
    """Dependency-level rate limit for the classify route (belt + suspenders)."""
    ip = _get_client_ip(request)
    allowed, _ = _sliding_window_check("classify", ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Classify rate limit: {settings.CLASSIFY_RATE_LIMIT} requests/min",
            headers={"Retry-After": "60"},
        )
