import json
import re
from pathlib import Path
from typing import Iterable

from app.core.config import settings
from app.models.disease import DiseaseRecord


TOKEN_SPLIT_PATTERN = re.compile(r"[^a-z0-9\u0900-\u097f\u0b80-\u0bff]+", re.IGNORECASE)


class DiseaseMatcher:
    def __init__(self, dataset_path: str) -> None:
        self.dataset_path = Path(dataset_path)
        self.records = self._load_dataset()
        self._multilingual_normalization = self._build_multilingual_map()

    def _load_dataset(self) -> list[DiseaseRecord]:
        with self.dataset_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return [DiseaseRecord.model_validate(item) for item in data]

    @staticmethod
    def _build_multilingual_map() -> dict[str, str]:
        return {
            "पीला": "yellow",
            "धब्बे": "spots",
            "पत्ते": "leaves",
            "मुड़ना": "curl",
            "सूखना": "wilting",
            "சேதம்": "damage",
            "மஞ்சள்": "yellow",
            "புள்ளி": "spot",
            "இலை": "leaf",
            "வாடுதல்": "wilting",
        }

    def _normalize_text(self, text: str) -> str:
        lowered = text.lower()
        for src, tgt in self._multilingual_normalization.items():
            lowered = lowered.replace(src, f" {tgt} ")
        return lowered

    def _tokenize(self, text: str) -> set[str]:
        normalized = self._normalize_text(text)
        return {t for t in TOKEN_SPLIT_PATTERN.split(normalized) if len(t) > 1}

    @staticmethod
    def _jaccard_similarity(query_tokens: set[str], target_tokens: set[str]) -> float:
        if not query_tokens or not target_tokens:
            return 0.0
        inter = query_tokens.intersection(target_tokens)
        union = query_tokens.union(target_tokens)
        return len(inter) / len(union)

    @staticmethod
    def _phrase_match_ratio(query_text: str, symptom_phrases: Iterable[str]) -> tuple[float, list[str]]:
        symptom_list = list(symptom_phrases)
        matched: list[str] = []
        query_norm = f" {query_text} "
        for phrase in symptom_list:
            phrase_norm = f" {phrase.lower()} "
            if phrase_norm in query_norm:
                matched.append(phrase)
        if not symptom_list:
            return 0.0, matched
        return len(matched) / len(symptom_list), matched

    def match(self, query: str) -> dict:
        query_norm = self._normalize_text(query)
        query_tokens = self._tokenize(query_norm)

        scored: list[dict] = []
        for record in self.records:
            symptom_text = " ".join(record.symptoms + record.symptom_keywords)
            disease_tokens = self._tokenize(symptom_text)
            token_score = self._jaccard_similarity(query_tokens, disease_tokens)
            phrase_score, phrase_hits = self._phrase_match_ratio(query_norm, record.symptoms)

            confidence = (0.65 * token_score) + (0.35 * phrase_score)

            scored.append(
                {
                    "record": record,
                    "confidence": round(float(confidence), 4),
                    "matched_symptoms": phrase_hits,
                }
            )

        scored.sort(key=lambda item: item["confidence"], reverse=True)
        best = scored[0] if scored else None

        if best is None:
            raise RuntimeError("Disease dataset is empty; unable to evaluate query")

        record: DiseaseRecord = best["record"]
        confidence = max(0.05, min(0.99, best["confidence"]))

        return {
            "crop": record.crop,
            "disease": record.disease,
            "confidence": confidence,
            "matched_symptoms": best["matched_symptoms"],
            "remedy": record.remedy.model_dump(),
        }


matcher = DiseaseMatcher(settings.disease_dataset_path)
