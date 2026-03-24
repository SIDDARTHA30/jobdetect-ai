import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional


def _sanitize(text: str) -> str:
    """Strip dangerous characters / HTML tags."""
    text = re.sub(r"<[^>]+>", "", text)  # strip HTML
    text = text.strip()
    return text


class JobPostingInput(BaseModel):
    title: str = Field(..., min_length=2, max_length=200,
                       description="Job title — 2 to 200 characters")
    description: str = Field(..., min_length=10, max_length=10000,
                              description="Full job description — 10 to 10,000 characters")
    company: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    salary_range: Optional[str] = Field(None, max_length=100)
    requirements: Optional[str] = Field(None, max_length=2000)

    @field_validator("title", "description", "company", "location",
                     "salary_range", "requirements", mode="before")
    @classmethod
    def sanitize_text(cls, v):
        if v is None:
            return v
        if not isinstance(v, str):
            raise ValueError("Must be a string")
        return _sanitize(v)

    @field_validator("description")
    @classmethod
    def check_description_quality(cls, v):
        if v and len(v.split()) < 3:
            raise ValueError("Description must contain at least 3 words")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Senior Machine Learning Engineer",
                "description": "We are looking for an ML engineer to build recommendation systems...",
                "company": "TechCorp AI",
                "location": "Remote",
                "salary_range": "$150k - $200k",
            }
        }
    }
