from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.services.analysis_service import AnalysisService
from app.database.db import get_db
from app.auth.jwt_handler import get_current_user_db, UserOut

router = APIRouter()

VALID_CATEGORIES = {
    "software_engineering","data_science","product_management","design",
    "marketing","sales","finance","operations","customer_support",
    "human_resources","legal","healthcare",
}


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user_db),
):
    return await AnalysisService(db).get_category_stats()


@router.get("/trends")
async def get_trends(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user_db),
):
    return await AnalysisService(db).get_trends(days)


@router.get("/top-keywords")
async def get_top_keywords(
    category: Optional[str] = Query(default=None, max_length=50),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user_db),
):
    # Whitelist category values
    if category and category not in VALID_CATEGORIES:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=f"Invalid category: {category!r}")
    return await AnalysisService(db).get_top_keywords(category)
