import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.job_model import JobPostingInput
from app.models.prediction_model import PredictionResponse, CategoryScore
from app.ml.predictor import Predictor
from app.database.schemas import Job, Prediction
from app.utils.logger import get_logger
from datetime import datetime, timezone
from typing import Optional

logger = get_logger(__name__)


class ClassifierService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.predictor = Predictor()

    async def classify(
        self,
        job_input: JobPostingInput,
        submitted_by: Optional[str] = None,
    ) -> PredictionResponse:
        start = time.perf_counter()

        job = Job(
            title=job_input.title,
            description=job_input.description,
            company=job_input.company,
            location=job_input.location,
            salary_range=job_input.salary_range,
            requirements=job_input.requirements,
            created_by=submitted_by,
        )
        self.db.add(job)
        await self.db.flush()

        result = self.predictor.predict(job_input)
        elapsed = (time.perf_counter() - start) * 1000

        top_cats = [
            CategoryScore(category=k, confidence=v, label=k.replace("_", " ").title())
            for k, v in sorted(result["all_scores"].items(), key=lambda x: -x[1])[:3]
        ]

        prediction = Prediction(
            job_id=job.id,
            predicted_category=result["category"],
            confidence=result["confidence"],
            all_scores=result["all_scores"],
            is_fraudulent=result["is_fraudulent"],
            fraud_probability=result["fraud_probability"],
            processing_time_ms=elapsed,
        )
        self.db.add(prediction)
        await self.db.commit()
        await self.db.refresh(prediction)

        logger.info(
            f"classify | id={prediction.id} | cat={result['category']} "
            f"| conf={result['confidence']:.2f} | fraud={result['is_fraudulent']} "
            f"| {elapsed:.1f}ms | by={submitted_by}"
        )

        return PredictionResponse(
            id=prediction.id,
            predicted_category=result["category"],
            confidence=result["confidence"],
            all_scores=result["all_scores"],
            top_categories=top_cats,
            is_fraudulent=result["is_fraudulent"],
            fraud_probability=result["fraud_probability"],
            timestamp=datetime.now(timezone.utc),
            processing_time_ms=elapsed,
        )

    async def get_history(self, limit: int) -> list:
        result = await self.db.execute(
            select(Prediction).order_by(Prediction.created_at.desc()).limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, job_id: int):
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()
