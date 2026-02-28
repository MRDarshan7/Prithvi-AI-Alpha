from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class WeatherPayload(BaseModel):
    temperature: float
    humidity: int
    rain_mm_1h: float
    rain_expected_next_12h: bool
    wind_speed: float
    condition: str


class AnalyzeResponse(BaseModel):
    disease: str
    crop: str
    confidence: float
    matched_symptoms: list[str]
    remedy: dict
    weather: WeatherPayload
    weather_advisory: list[str]
