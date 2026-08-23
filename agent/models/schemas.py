"""Pydantic models for all data shapes across the pipeline."""
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class Snapshot(BaseModel):
    collector_id: str
    url: str
    text: str
    scraped_at: datetime
    raw: dict


class DiffResult(BaseModel):
    collector_id: str
    changed: bool
    lines: list[str]
    diffed_at: datetime


class Alert(BaseModel):
    collector_id: str
    severity: Literal["INFO", "WARNING", "CRITICAL"]
    message: str
    draft_script: Optional[str]
    created_at: datetime


class HealEvent(BaseModel):
    collector_id: str
    broke_at: datetime
    healed_at: Optional[datetime]
    description: str
    attempts: int


class InventoryItem(BaseModel):
    id: str
    name: str            
    category: str        
    purchased_year: Optional[int]


class RecallMatch(BaseModel):
    inventory_item_id: str
    recall_title: str
    recall_url: str
    confidence: float    
    hazard: Optional[str]
