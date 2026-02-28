from fastapi import APIRouter, HTTPException
from httpx import HTTPError

from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse, WeatherPayload
from app.services.advisory_service import build_weather_advisory
from app.services.disease_matcher import matcher
from app.services.weather_service import weather_service

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    disease_result = matcher.match(payload.query)

    try:
        weather = await weather_service.fetch(payload.lat, payload.lon)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Weather provider request failed: {str(exc)}") from exc

    advisories = build_weather_advisory(weather)

    return AnalyzeResponse(
        disease=disease_result["disease"],
        crop=disease_result["crop"],
        confidence=disease_result["confidence"],
        matched_symptoms=disease_result["matched_symptoms"],
        remedy=disease_result["remedy"],
        weather=WeatherPayload(
            temperature=weather.temperature,
            humidity=weather.humidity,
            rain_mm_1h=weather.rain_mm_1h,
            rain_expected_next_12h=weather.rain_expected_next_12h,
            wind_speed=weather.wind_speed,
            condition=weather.condition,
        ),
        weather_advisory=advisories,
    )
