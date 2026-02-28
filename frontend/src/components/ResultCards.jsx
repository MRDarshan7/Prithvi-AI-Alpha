import { useEffect, useState } from "react";

function ResultCards({ result }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!result) return;
    setIsVisible(false);
    const animationFrame = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [result]);

  if (!result) return null;

  return (
    <section
      className={`mt-6 grid gap-4 transition-all duration-500 ease-out md:grid-cols-2 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <article className="card p-4">
        <h2 className="text-lg font-semibold text-brand-700">Disease Detection</h2>
        <p className="mt-2 text-sm text-slate-500">Crop: {result.crop}</p>
        <p className="mt-1 text-xl font-bold">{result.disease}</p>
        <p className="mt-2 text-sm">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
        <p className="mt-2 text-sm text-slate-600">
          Matched symptoms: {result.matched_symptoms.length ? result.matched_symptoms.join(", ") : "No direct phrase matches"}
        </p>
      </article>

      <article className="card p-4">
        <h2 className="text-lg font-semibold text-brand-700">Remedy</h2>
        <p className="mt-2 text-sm"><span className="font-semibold">Chemical:</span> {result.remedy.chemical}</p>
        <p className="mt-2 text-sm"><span className="font-semibold">Organic:</span> {result.remedy.organic}</p>
        {result.remedy.prevention && (
          <p className="mt-2 text-sm"><span className="font-semibold">Prevention:</span> {result.remedy.prevention}</p>
        )}
      </article>

      <article className="card p-4">
        <h2 className="text-lg font-semibold text-brand-700">Weather</h2>
        <p className="mt-2 text-sm">Condition: {result.weather.condition}</p>
        <p className="mt-1 text-sm">Temperature: {result.weather.temperature.toFixed(1)}°C</p>
        <p className="mt-1 text-sm">Humidity: {result.weather.humidity}%</p>
        <p className="mt-1 text-sm">Rain (last 1h): {result.weather.rain_mm_1h} mm</p>
        <p className="mt-1 text-sm">Wind: {result.weather.wind_speed} m/s</p>
      </article>

      <article className="card p-4">
        <h2 className="text-lg font-semibold text-brand-700">Weather Advisory</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
          {result.weather_advisory.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export default ResultCards;
