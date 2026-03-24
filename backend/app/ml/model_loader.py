"""
Secure ML model loader.
Checks: file exists, correct extension, minimum size, valid sklearn interface.
Optionally verifies SHA-256 checksum if MODEL_CHECKSUM is set in .env.
"""
import pickle
import warnings
import hashlib
from pathlib import Path
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
_model = None

_ALLOWED_EXTENSIONS = {".pkl", ".joblib"}
_MIN_FILE_SIZE      = 1_000     # 1 KB — real models are much larger
_MAX_FILE_SIZE      = 500_000_000  # 500 MB cap — sanity check
_REQUIRED_METHODS   = ("predict", "predict_proba", "classes_")


def _compute_sha256(path: Path) -> str:
    sha = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha.update(chunk)
    return sha.hexdigest()


def _validate_file(path: Path) -> tuple[bool, str]:
    """Returns (ok, reason). All checks must pass."""
    if not path.exists():
        return False, "File does not exist"
    if not path.is_file():
        return False, "Path is not a regular file"
    if path.suffix.lower() not in _ALLOWED_EXTENSIONS:
        return False, f"Untrusted extension '{path.suffix}' — only {_ALLOWED_EXTENSIONS} allowed"

    size = path.stat().st_size
    if size < _MIN_FILE_SIZE:
        return False, f"File too small ({size} bytes) — likely corrupted or empty"
    if size > _MAX_FILE_SIZE:
        return False, f"File too large ({size} bytes) — potential attack"

    # Optional checksum verification (set MODEL_CHECKSUM=sha256:abc... in .env)
    expected_checksum = getattr(settings, "MODEL_CHECKSUM", None)
    if expected_checksum and expected_checksum.startswith("sha256:"):
        expected_hash = expected_checksum[7:]
        actual_hash   = _compute_sha256(path)
        if actual_hash != expected_hash:
            return False, f"Checksum mismatch! expected={expected_hash[:16]}... actual={actual_hash[:16]}..."
        logger.info("✅ Model checksum verified")

    return True, "OK"


def _validate_interface(model) -> tuple[bool, str]:
    """Verify loaded object has the expected sklearn interface."""
    for attr in _REQUIRED_METHODS:
        if not hasattr(model, attr):
            return False, f"Model missing required attribute: {attr!r}"
    # Quick sanity: classes_ should be a list/array with at least 2 elements
    try:
        classes = list(model.classes_)
        if len(classes) < 2:
            return False, f"Model has only {len(classes)} class — invalid classifier"
    except Exception as e:
        return False, f"Cannot read model.classes_: {e}"
    return True, "OK"


def load_model():
    global _model
    model_path = Path(settings.MODEL_PATH).resolve()
    logger.info(f"Loading model from: {model_path}")

    ok, reason = _validate_file(model_path)
    if not ok:
        logger.warning(f"⚠️  Model file validation failed: {reason}")
        logger.warning("Using mock predictor — classify will use random scores")
        _model = None
        return

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")  # suppress sklearn version mismatch
            with open(model_path, "rb") as f:
                candidate = pickle.load(f)

        ok, reason = _validate_interface(candidate)
        if not ok:
            logger.error(f"Model interface validation failed: {reason}")
            _model = None
            return

        _model = candidate
        checksum = _compute_sha256(model_path)
        logger.info(f"✅ Model loaded safely | classes={list(_model.classes_)} | sha256={checksum[:16]}...")

    except pickle.UnpicklingError as e:
        logger.error(f"Pickle error — possibly corrupt or malicious file: {e}")
        _model = None
    except Exception as e:
        logger.error(f"Unexpected error loading model: {e}")
        _model = None


def get_model():
    return _model
