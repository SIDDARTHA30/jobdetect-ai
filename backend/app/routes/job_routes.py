from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job_model import JobPostingInput
from app.models.prediction_model import PredictionResponse
from app.services.classifier_service import ClassifierService
from app.database.db import get_db
from app.auth.jwt_handler import get_current_user_db, UserOut
from app.middleware.rate_limiter import classify_rate_limit
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/classify", response_model=PredictionResponse)
async def classify_job(
    job: JobPostingInput,                                     # Pydantic validates + sanitizes
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user_db),    # JWT required
    _rate: None = Depends(classify_rate_limit),               # double rate check
):
    logger.info(f"classify | user={current_user.username} | title={job.title[:40]!r}")
    try:
        service = ClassifierService(db)
        result = await service.classify(job, submitted_by=current_user.username)
        return result
    except Exception as e:
        logger.error(f"classify error for {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail="Classification failed. Please try again.")


@router.get("/history")
async def get_history(
    limit: int = Query(default=20, ge=1, le=100, description="Max 100 records"),
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user_db),
):
    logger.debug(f"history | user={current_user.username} | limit={limit}")
    service = ClassifierService(db)
    return await service.get_history(limit)


@router.get("/{job_id}")
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user_db),
):
    if job_id < 1:
        raise HTTPException(status_code=422, detail="job_id must be a positive integer")
    service = ClassifierService(db)
    job = await service.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
