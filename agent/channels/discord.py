import os
import httpx
from typing import Dict, Any, Optional
from .base import BaseChannel, NotificationPayload, ChannelResult


class DiscordChannel(BaseChannel):
    COLOR_MAP = {
        "CRITICAL": 0xE6007A,
        "WARNING": 0xFFD400,
        "INFO": 0x00F0FF,
    }

    def __init__(self, config: Dict[str, Any], channel_id: Optional[int] = None):
        super().__init__("discord", config, channel_id)
        self.webhook_url = config.get("webhookUrl") or os.getenv("DISCORD_WEBHOOK_URL", "")
        self.username = config.get("username", "Spider-Sense Radar")
        self.avatar_url = config.get("avatarUrl")

    def build_embed(self, payload: NotificationPayload) -> Dict[str, Any]:
        color = self.COLOR_MAP.get(payload.severity, 0x00F0FF)
        fields = [
            {"name": "Severity", "value": f"`{payload.severity}`", "inline": True},
            {"name": "Radar Sector", "value": f"`{payload.category.upper()}`", "inline": True},
        ]

        if payload.url:
            fields.append({"name": "Target Link", "value": f"[Open Document]({payload.url})", "inline": False})

        embed_data: Dict[str, Any] = {
            "title": payload.title,
            "description": payload.message,
            "color": color,
            "fields": fields,
            "footer": {
                "text": "Spider-Sense Control Room",
            },
            "timestamp": payload.timestamp.isoformat(),
        }
        return embed_data

    async def send(self, payload: NotificationPayload) -> ChannelResult:
        if not self.webhook_url:
            return ChannelResult(
                success=False,
                provider="discord",
                channel_id=self.channel_id,
                error="Missing Discord webhook URL.",
            )

        body = {
            "username": self.username,
            "embeds": [self.build_embed(payload)],
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(self.webhook_url, json=body)

                if res.status_code in (200, 204):
                    return ChannelResult(
                        success=True,
                        provider="discord",
                        channel_id=self.channel_id,
                        raw_response={"status": res.status_code},
                    )
                else:
                    return ChannelResult(
                        success=False,
                        provider="discord",
                        channel_id=self.channel_id,
                        error=f"Discord webhook failed with HTTP {res.status_code}: {res.text}",
                        raw_response={"status": res.status_code, "text": res.text},
                    )
        except Exception as e:
            return ChannelResult(
                success=False,
                provider="discord",
                channel_id=self.channel_id,
                error=f"Network error sending Discord webhook: {str(e)}",
            )
