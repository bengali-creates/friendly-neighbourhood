"""Scraper package for Spider-Sense microservice."""
from .types import ScrapedSnapshot
from .engine import ScraperEngine

__all__ = ["ScraperEngine", "ScrapedSnapshot"]
