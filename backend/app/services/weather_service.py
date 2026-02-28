from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx

from app.core.config import settings


@dataclass
class WeatherSnapshot:
    temperature: float
    humidity: int
    rain_mm_1h: float
    rain_expected_next_12h: bool
    wind_speed: float
    condition: str


class WeatherService:
    def __init__(self) -> None:
        self.api_key = settings.openweather_api_key
        self.units = settings.openweather_units
        self.lang = settings.openweather_lang

    async def _get_current(self, client: httpx.AsyncClient, lat: float, lon: float) -> dict:
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": self.units,
                "lang": self.lang,
            },
            timeout=12.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def _get_forecast(self, client: httpx.AsyncClient, lat: float, lon: float) -> dict:
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/forecast",
            params={
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": self.units,
                "lang": self.lang,
            },
            timeout=12.0,
        )
        resp.raise_for_status()
        return resp.json()

    async def fetch(self, lat: float, lon: float) -> WeatherSnapshot:
        async with httpx.AsyncClient() as client:
            current, forecast = await asyncio.gather(
                self._get_current(client, lat, lon),
                self._get_forecast(client, lat, lon),
            )

        weather = current.get("weather", [{}])[0]
        main = current.get("main", {})
        wind = current.get("wind", {})
        rain = current.get("rain", {})
        rain_mm_1h = float(rain.get("1h", 0.0) or 0.0)

        rain_expected = False
        for item in forecast.get("list", [])[:4]:
            rain_block = item.get("rain", {})
            rain_volume = float(rain_block.get("3h", 0.0) or 0.0)
            if rain_volume > 0:
                rain_expected = True
                break

        return WeatherSnapshot(
            temperature=float(main.get("temp", 0.0)),
            humidity=int(main.get("humidity", 0)),
            rain_mm_1h=rain_mm_1h,
            rain_expected_next_12h=rain_expected,
            wind_speed=float(wind.get("speed", 0.0)),
            condition=str(weather.get("description", "unknown")),
        )


weather_service = WeatherService()
