"""
JOBDETECT structured logger.

Features:
  ✅ INFO/WARNING/ERROR separation — console shows INFO+, file gets DEBUG+
  ✅ Separate error.log file — only ERROR and CRITICAL
  ✅ Rotating file logs — max 5MB per file, 5 backups (won't fill disk)
  ✅ Color-coded console output — easy to read in terminal
  ✅ Structured format — timestamp | level | module | message
  ✅ Access log — separate file for HTTP request logs
"""
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

# ── Log directory ─────────────────────────────────────────
LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# ── File sizes / rotation ─────────────────────────────────
_MAX_BYTES  = 5 * 1024 * 1024   # 5 MB per file
_BACKUP_COUNT = 5               # keep last 5 rotated files

# ── Formatters ────────────────────────────────────────────
_FILE_FMT = logging.Formatter(
    fmt="%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

_CONSOLE_FMT = logging.Formatter(
    fmt="[%(asctime)s] %(levelname)-8s %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)

# ── ANSI color codes for console ──────────────────────────
class _ColorConsoleFormatter(logging.Formatter):
    COLORS = {
        logging.DEBUG:    "\033[37m",     # white
        logging.INFO:     "\033[36m",     # cyan
        logging.WARNING:  "\033[33m",     # yellow
        logging.ERROR:    "\033[31m",     # red
        logging.CRITICAL: "\033[1;31m",   # bold red
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelno, self.RESET)
        msg = super().format(record)
        return f"{color}{msg}{self.RESET}"


_COLOR_FMT = _ColorConsoleFormatter(
    fmt="[%(asctime)s] %(levelname)-8s %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)

# ── Handler factory ───────────────────────────────────────
def _make_rotating(filename: str, level: int) -> RotatingFileHandler:
    h = RotatingFileHandler(
        LOG_DIR / filename,
        maxBytes=_MAX_BYTES,
        backupCount=_BACKUP_COUNT,
        encoding="utf-8",
    )
    h.setLevel(level)
    h.setFormatter(_FILE_FMT)
    return h


# ── Shared handlers (created once, reused) ────────────────
_console_handler = logging.StreamHandler(sys.stdout)
_console_handler.setLevel(logging.INFO)
_console_handler.setFormatter(_COLOR_FMT)

_app_handler   = _make_rotating("app.log",    logging.DEBUG)      # everything
_error_handler = _make_rotating("error.log",  logging.ERROR)      # errors only
_access_handler = _make_rotating("access.log", logging.DEBUG)     # HTTP access log

# ── Public API ────────────────────────────────────────────
def get_logger(name: str) -> logging.Logger:
    """
    Get a named logger with the JOBDETECT config.

    Log files:
      logs/app.log    — all DEBUG+ messages (rotating 5MB × 5)
      logs/error.log  — ERROR and CRITICAL only (rotating 5MB × 5)
      logs/access.log — HTTP access log (populated by logging_middleware)
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    # Access logger gets its own file
    if name == "access":
        logger.addHandler(_access_handler)
        logger.addHandler(_console_handler)
    else:
        logger.addHandler(_console_handler)
        logger.addHandler(_app_handler)
        logger.addHandler(_error_handler)

    logger.propagate = False
    return logger


def get_access_logger() -> logging.Logger:
    return get_logger("access")
