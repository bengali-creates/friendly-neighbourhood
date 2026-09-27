"""Scraper package for Spider-Sense microservice."""
from .types import ScrapedSnapshot
from .engine import ScraperEngine
from .quality import ScrapeQualityScorer, ScrapeQualityResult
from .crawl4ai_engine import Crawl4AIScraper

__all__ = ["ScraperEngine", "ScrapedSnapshot", "ScrapeQualityScorer", "ScrapeQualityResult", "Crawl4AIScraper"]
