"""
Scrape Quality Scorer for Spider-Sense.
Evaluates scraped document snapshots for content density, bot-block signatures,
HTTP error pages, and structural integrity.
"""

import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class ScrapeQualityResult:
    score: float  # 0.0 to 100.0
    passed: bool
    is_bot_blocked: bool
    is_error_page: bool
    reason: str
    issues: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)


class ScrapeQualityScorer:
    BOT_SIGNATURES = [
        "just a moment...",
        "attention required! | cloudflare",
        "cf-chl-bypass",
        "checking if the site connection is secure",
        "cf-browser-verification",
        "ray id:",
        "access denied",
        "403 forbidden",
        "request blocked",
        "please verify you are a human",
        "verify you are human",
        "g-recaptcha",
        "hcaptcha",
        "perimeterx",
        "datadome",
        "incapsula",
        "please enable cookies",
        "security check to access",
        "unusual traffic from your computer network",
    ]

    ERROR_SIGNATURES = [
        "404 not found",
        "page not found",
        "the requested url was not found",
        "502 bad gateway",
        "500 internal server error",
        "503 service unavailable",
        "404 error",
        "page does not exist",
        "server error",
        "error 404",
        "page cannot be found",
    ]

    @classmethod
    def evaluate(
        cls,
        snapshot: Optional[Dict[str, Any]],
        min_chars: int = 120,
        min_words: int = 20,
        pass_threshold: float = 50.0,
    ) -> ScrapeQualityResult:

        if not snapshot:
            return ScrapeQualityResult(
                score=0.0,
                passed=False,
                is_bot_blocked=False,
                is_error_page=False,
                reason="Snapshot is empty or null",
                issues=["No snapshot payload returned"],
            )

        raw_text = snapshot.get("raw_text") or snapshot.get("text") or ""
        clean_text = raw_text.strip()
        text_lower = clean_text.lower()
        title_lower = (snapshot.get("title") or "").lower()
        sections = snapshot.get("sections") or {}

        issues: List[str] = []
        is_bot_blocked = False
        is_error_page = False

        for sig in cls.BOT_SIGNATURES:
            if sig in text_lower or sig in title_lower:
                is_bot_blocked = True
                issues.append(f"Bot-challenge detected: '{sig}'")
                break

        for err_sig in cls.ERROR_SIGNATURES:
            if err_sig in title_lower or (err_sig in text_lower and len(clean_text) < 600):
                is_error_page = True
                issues.append(f"HTTP error page detected: '{err_sig}'")
                break

        char_count = len(clean_text)
        words = re.findall(r"\b\w+\b", clean_text)
        word_count = len(words)
        section_count = len(sections)

        metrics = {
            "char_count": char_count,
            "word_count": word_count,
            "section_count": section_count,
            "title": snapshot.get("title") or "",
        }

        if is_bot_blocked:
            return ScrapeQualityResult(
                score=10.0,
                passed=False,
                is_bot_blocked=True,
                is_error_page=is_error_page,
                reason=f"Scraper was blocked by bot protection ({issues[0]})",
                issues=issues,
                metrics=metrics,
            )

        if is_error_page:
            return ScrapeQualityResult(
                score=15.0,
                passed=False,
                is_bot_blocked=False,
                is_error_page=True,
                reason=f"Target URL returned an error page ({issues[0]})",
                issues=issues,
                metrics=metrics,
            )

        score = 0.0

        if char_count >= 1000:
            score += 40.0
        elif char_count >= 300:
            score += 30.0
        elif char_count >= min_chars:
            score += 20.0
        else:
            issues.append(f"Content length ({char_count} chars) is below minimum threshold ({min_chars} chars)")

        if word_count >= 150:
            score += 30.0
        elif word_count >= 40:
            score += 25.0
        elif word_count >= min_words:
            score += 15.0
        else:
            issues.append(f"Word count ({word_count} words) is below minimum threshold ({min_words} words)")

        if section_count >= 2:
            score += 30.0
        elif section_count >= 1:
            score += 20.0
        elif char_count >= 500:
            score += 10.0
        else:
            issues.append("Document has no structured sections")

        score = max(0.0, min(100.0, score))
        passed = score >= pass_threshold and not is_bot_blocked and not is_error_page

        if not passed and not issues:
            issues.append(f"Score ({score:.1f}) is below pass threshold ({pass_threshold})")

        reason = "Document passed quality integrity checks" if passed else "; ".join(issues)

        return ScrapeQualityResult(
            score=score,
            passed=passed,
            is_bot_blocked=False,
            is_error_page=False,
            reason=reason,
            issues=issues,
            metrics=metrics,
        )
