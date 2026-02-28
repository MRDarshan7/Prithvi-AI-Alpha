from app.services.weather_service import WeatherSnapshot


def build_weather_advisory(weather: WeatherSnapshot) -> list[str]:
    advisories: list[str] = []

    if weather.humidity > 80:
        advisories.append("High fungal risk due to humidity above 80%. Use preventive fungicide and improve airflow.")

    if weather.rain_expected_next_12h:
        advisories.append("Rain is expected within 12 hours. Avoid spraying now to reduce wash-off losses.")

    if weather.temperature >= 35:
        advisories.append("High temperature stress likely. Prefer early-morning irrigation and mulch moisture retention.")

    if weather.wind_speed >= 8:
        advisories.append("Strong winds detected. Postpone foliar sprays to avoid drift and uneven coverage.")

    if not advisories:
        advisories.append("Weather is currently stable for routine field operations. Continue crop monitoring.")

    return advisories
