from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class NotificationPayload(BaseModel):
    title: str
    message: str
    severity: str = "INFO"
    category: str = "general"
    url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChannelResult(BaseModel):
    success: bool
    provider: str
    channel_id: Optional[int] = None
    message_id: Optional[str] = None
    error: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None


class BaseChannel(ABC):
    def __init__(self, provider: str, config: Dict[str, Any], channel_id: Optional[int] = None):
        self.provider = provider
        self.config = config
        self.channel_id = channel_id

    @abstractmethod
    async def send(self, payload: NotificationPayload) -> ChannelResult:
        pass

    async def test_connection(self) -> ChannelResult:
        test_payload = NotificationPayload(
            title="Spider-Sense Signal Test",
            message="Transmitter online. Real-time radar alert channel verified successfully.",
            severity="INFO",
            category="general",
            url="http://localhost:3000/dashboard",
        )
        return await self.send(test_payload)
