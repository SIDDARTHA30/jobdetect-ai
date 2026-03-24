from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.database.schemas import Prediction, Job
from collections import Counter
import json

class AnalysisService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_category_stats(self):
        result = await self.db.execute(
            select(Prediction.predicted_category, func.count(Prediction.id).label("count"))
            .group_by(Prediction.predicted_category)
            .order_by(func.count(Prediction.id).desc())
        )
        rows = result.all()
        total = sum(r.count for r in rows)
        return [
            {
                "category": r.predicted_category,
                "count": r.count,
                "percentage": round(r.count / total * 100, 1) if total else 0,
            }
            for r in rows
        ]

    async def get_trends(self, days: int):
        result = await self.db.execute(
            select(
                func.date(Prediction.created_at).label("date"),
                func.count(Prediction.id).label("count"),
            )
            .group_by(func.date(Prediction.created_at))
            .order_by(func.date(Prediction.created_at))
            .limit(days)
        )
        return [{"date": str(r.date), "count": r.count} for r in result.all()]

    async def get_top_keywords(self, category: str = None):
        query = select(Job.title, Job.description)
        if category:
            query = query.join(Prediction, Prediction.job_id == Job.id).where(
                Prediction.predicted_category == category
            )
        result = await self.db.execute(query.limit(200))
        rows = result.all()
        words = []
        for row in rows:
            text_combined = f"{row.title} {row.description}".lower().split()
            words.extend([w for w in text_combined if len(w) > 4])
        counter = Counter(words)
        return [{"word": w, "count": c} for w, c in counter.most_common(30)]
