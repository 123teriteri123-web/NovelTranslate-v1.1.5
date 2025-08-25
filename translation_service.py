
import os
import time
import logging
import requests
from typing import Optional, List

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-2-9b-it:free")

class TranslationService:
    """
    Thin wrapper around OpenRouter's Chat Completions API.
    - Reads API key from env OPENROUTER_API_KEY (or provided in constructor).
    - Splits long text into chunks and reassembles preserving paragraphs.
    - Retries transient errors with exponential backoff.
    - Keeps formatting markers and basic scene breaks.
    """
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, referer: str = "http://localhost:5000", title: str = "Novel Translation Dashboard"):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "").strip()
        self.model = model or DEFAULT_MODEL
        self.referer = referer
        self.title = title
        if not self.api_key:
            raise ValueError("Missing OPENROUTER_API_KEY. Set it in the environment.")

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.referer,
            "X-Title": self.title
        }

    def _chunk_paragraphs(self, text: str, max_chars: int = 3500) -> List[str]:
        # Keep paragraphs and simple scene breaks
        paras = re.split(r'(\n{2,}|\n?[*]{3,}\n?)', text, flags=re.MULTILINE)
        # Re-join tokens keeping separators; paras list includes separators at odd indices
        rebuilt = []
        buf = ""
        for token in paras:
            if len(buf) + len(token) > max_chars and buf:
                rebuilt.append(buf)
                buf = token
            else:
                buf += token
        if buf:
            rebuilt.append(buf)
        return [s.strip() for s in rebuilt if s.strip()]

    def _call_api(self, prompt: str, source_language: str, target_language: str, temperature: float = 0.2, max_retries: int = 5) -> str:
        import re as _re  # avoid shadowing
        payload = {
            "model": self.model,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": (
                    "You are a professional literary translator. "
                    "Translate the user's text from {src} to {tgt}. "
                    "Preserve original formatting: paragraph breaks, scene breaks (***), inline punctuation, and dialogue line-per-line. "
                    "Do NOT add summaries or commentary. Only return the translated text."
                ).format(src=source_language, tgt=target_language)},
                {"role": "user", "content": prompt}
            ]
        }

        for attempt in range(max_retries):
            try:
                r = requests.post(OPENROUTER_URL, headers=self.headers, json=payload, timeout=60)
                if r.status_code == 200:
                    data = r.json()
                    # OpenRouter returns OpenAI-compatible structure
                    content = data["choices"][0]["message"]["content"]
                    return content
                elif r.status_code in (429, 500, 502, 503, 504):
                    # rate limit / transient
                    wait = min(2 ** attempt, 20)
                    time.sleep(wait)
                    continue
                else:
                    logging.error("OpenRouter error %s: %s", r.status_code, r.text[:300])
                    raise RuntimeError(f"OpenRouter API error: {r.status_code} {r.text[:200]}")
            except requests.RequestException as e:
                wait = min(2 ** attempt, 20)
                logging.warning("Request error: %s; retrying in %ss", e, wait)
                time.sleep(wait)
        raise RuntimeError("Translation failed after retries.")

    def translate(self, text: str, source_language: str = "auto", target_language: str = "English") -> str:
        text = text.strip()
        if not text:
            return ""
        chunks = self._chunk_paragraphs(text)
        outputs = []
        for chunk in chunks:
            out = self._call_api(chunk, source_language=source_language, target_language=target_language)
            outputs.append(out.strip())
        result = "\n\n".join(outputs)
        return self._post_format(result)

    def _post_format(self, text: str) -> str:
        # Automatic output formatting: collapse excessive blank lines, normalize spaces around quotes/dashes
        import re
        s = text.replace("\r\n", "\n").replace("\r", "\n")
        # Normalize triple scene breaks
        s = re.sub(r"\n\s*\*{3,}\s*\n", "\n***\n", s)
        # Collapse >2 blank lines to exactly 2
        s = re.sub(r"\n{3,}", "\n\n", s)
        # Fix spaces before punctuation
        s = re.sub(r"\s+([,.;:!?])", r"\1", s)
        # Trim trailing spaces on each line
        s = "\n".join(line.rstrip() for line in s.split("\n"))
        return s

    def test_api_connection(self) -> bool:
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Reply with the single word: pong"}
                ]
            }
            r = requests.post(OPENROUTER_URL, headers=self.headers, json=payload, timeout=20)
            if r.status_code != 200:
                return False
            txt = r.json()["choices"][0]["message"]["content"].strip().lower()
            return "pong" in txt
        except Exception as e:
            logging.error("API connection test failed: %s", e)
            return False
