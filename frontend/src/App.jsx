import { useEffect, useMemo, useRef, useState } from "react";

import ResultCards from "./components/ResultCards";
import { analyzeFarmQuery } from "./services/api";

const languageOptions = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ta-IN", label: "Tamil" }
];

const fallbackLocation = { lat: 11.94, lon: 79.8 };

function Spinner({ className = "h-5 w-5" }) {
  return (
    <span
      className={`${className} inline-block animate-spin rounded-full border-2 border-current border-t-transparent`}
      aria-hidden="true"
    />
  );
}

function ListeningIndicator({ listening }) {
  if (!listening) return null;

  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4 animate-pulse"
        aria-hidden="true"
      >
        <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z" />
        <path d="M11 18.93V21a1 1 0 1 0 2 0v-2.07A8 8 0 0 0 20 11a1 1 0 1 0-2 0 6 6 0 1 1-12 0 1 1 0 1 0-2 0 8 8 0 0 0 7 7.93Z" />
      </svg>
      <span className="animate-pulse">Listening...</span>
    </div>
  );
}

function LoadingOverlay({ loading }) {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
        <Spinner className="h-6 w-6 text-brand-700" />
        <p className="text-sm font-semibold text-brand-900">Analyzing farm conditions...</p>
      </div>
    </div>
  );
}

function App() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("en-IN");
  const [location, setLocation] = useState(fallbackLocation);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
  const recognitionRef = useRef(null);

  const speechSupported = useMemo(() => {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  }, []);

  useEffect(() => {
    if (!result || !voiceResponseEnabled || !window.speechSynthesis) return;

    const advisoryText = result.weather_advisory?.[0] || "Weather conditions are suitable.";
    const spokenText = `Disease detected is ${result.disease}. Recommended treatment is ${result.remedy?.chemical || "consult local agronomist"}. ${advisoryText}`;
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = lang;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((voice) => voice.lang === lang) || voices.find((voice) => voice.lang.startsWith(lang.split("-")[0]));
    if (matchingVoice) utterance.voice = matchingVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [result, lang, voiceResponseEnabled]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const updateLocationFromBrowser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: Number(position.coords.latitude.toFixed(6)),
          lon: Number(position.coords.longitude.toFixed(6))
        });
      },
      () => {
        setLocation(fallbackLocation);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const startVoiceInput = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setError("Speech recognition not supported.");
    return;
  }

  // ✅ If already listening → STOP immediately
  if (recognitionRef.current) {
    recognitionRef.current.onend = null; // prevent delayed restart
    recognitionRef.current.stop();
    recognitionRef.current.abort(); // force stop immediately
    recognitionRef.current = null;
    setListening(false);
    return;
  }

  const recognition = new SpeechRecognition();

  recognitionRef.current = recognition;

  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    setListening(true);
    setError("");
  };

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    setQuery(spokenText);
  };

  recognition.onerror = () => {
    setListening(false);
    recognitionRef.current = null;
  };

  recognition.onend = () => {
    setListening(false);
    recognitionRef.current = null;
  };

  recognition.start();
};

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (query.trim().length < 3) {
      setError("Please provide a clearer crop symptom description.");
      return;
    }

    setLoading(true);
    try {
      const data = await analyzeFarmQuery({
        query,
        lat: location.lat,
        lon: location.lon
      });
      setResult(data);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-100 via-brand-50 to-white px-4 py-6">
      <LoadingOverlay loading={loading} />
      <div className="mx-auto max-w-4xl">
        <header className="rounded-2xl bg-brand-900 p-5 text-white shadow-lg">
          <h1 className="text-2xl font-bold">Prithvi AI</h1>
          <p className="mt-1 text-sm text-brand-100">Voice-Based Farmer Assistant with Weather Intelligence</p>
        </header>

        <form onSubmit={submit} className="card mt-5 p-4" aria-busy={loading}>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="md:col-span-3">
              <span className="mb-2 block text-sm font-medium">Symptom Query</span>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-600"
                placeholder="Example: my tomato leaves have yellow spots and rings"
              />
            </label>

            <div>
              <label className="mb-2 block text-sm font-medium">Language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm"
              >
                {languageOptions.map((option) => (
                  <option value={option.code} key={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!speechSupported || loading}
                onClick={startVoiceInput}
                className="mt-3 w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
              >
                {speechSupported ? (listening ? "Stop Microphone" : "Start Microphone") : "Mic Not Supported"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setVoiceResponseEnabled((current) => !current)}
                className={`mt-3 w-full rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  voiceResponseEnabled
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-300 bg-white text-slate-700"
                } disabled:bg-slate-100`}
              >
                Voice Response: {voiceResponseEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <ListeningIndicator listening={listening} />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={updateLocationFromBrowser}
              disabled={loading}
              className="rounded-xl border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700"
            >
              Use My GPS
            </button>
            <p className="self-center text-xs text-slate-600">
              Lat: {location.lat} | Lon: {location.lon}
            </p>
            <button
              type="submit"
              disabled={loading}
              className="sm:ml-auto rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Analyzing farm conditions...
                </span>
              ) : (
                "Analyze"
              )}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>

        <div className={loading ? "pointer-events-none select-none" : ""}>
          <ResultCards result={result} />
        </div>
      </div>
    </main>
  );
}

export default App;
