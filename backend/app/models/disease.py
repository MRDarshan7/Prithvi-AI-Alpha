from pydantic import BaseModel, Field


class Remedy(BaseModel):
    chemical: str
    organic: str
    prevention: str | None = None


class DiseaseRecord(BaseModel):
    crop: str
    disease: str
    symptoms: list[str] = Field(default_factory=list)
    symptom_keywords: list[str] = Field(default_factory=list)
    remedy: Remedy
