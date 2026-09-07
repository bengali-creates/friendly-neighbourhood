import os
from google import genai

_gemini_client = None


def get_gemini_client():
    """Lazy-init Google GenAI client. Uses GEMINI_API_KEY from .env."""
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        _gemini_client = genai.Client(api_key=api_key) if api_key else genai.Client()
    return _gemini_client


def ask_gemini(prompt: str, model: str = "gemini-3.6-flash") -> str:
    """One-shot text prompt → response string."""
    client = get_gemini_client()
    try:
        res = client.models.generate_content(model=model, contents=prompt)
        return res.text or ""
    except Exception as e:
        print(f"[ask_gemini error]: {e}")
        return ""
