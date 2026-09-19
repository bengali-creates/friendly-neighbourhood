import os
import asyncio
import httpx
from typing import List, Dict, Any, Optional
from .base import BaseChannel, NotificationPayload, ChannelResult
from .whatsapp import WhatsAppChannel
from .telegram import TelegramChannel
from .discord import DiscordChannel


class ChannelRouter:
    NEXT_API_BASE = os.getenv("NEXT_API_URL", "http://localhost:3000/api")

    @classmethod
    def create_channel_instance(
        cls, provider: str, config: Dict[str, Any], channel_id: Optional[int] = None
    ) -> Optional[BaseChannel]:
        prov = provider.lower().strip()
        if prov == "whatsapp":
            return WhatsAppChannel(config, channel_id=channel_id)
        elif prov == "telegram":
            return TelegramChannel(config, channel_id=channel_id)
        elif prov == "discord":
            return DiscordChannel(config, channel_id=channel_id)
        return None

    @classmethod
    async def load_configured_channels(cls) -> List[BaseChannel]:
        channels: List[BaseChannel] = []
        try:
            url = f"{cls.NEXT_API_BASE}/channels?enabled=true"
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    rows = data.get("data", [])
                    for row in rows:
                        inst = cls.create_channel_instance(
                            row.get("provider", ""),
                            row.get("config", {}),
                            channel_id=row.get("id"),
                        )
                        if inst:
                            channels.append(inst)
        except Exception:
            pass

        if not channels:
            if os.getenv("WHATSAPP_TOKEN") and os.getenv("WHATSAPP_PHONE_NUMBER_ID") and os.getenv("WHATSAPP_RECIPIENT_PHONE"):
                channels.append(
                    WhatsAppChannel(
                        {
                            "token": os.getenv("WHATSAPP_TOKEN"),
                            "phoneNumberId": os.getenv("WHATSAPP_PHONE_NUMBER_ID"),
                            "recipientPhone": os.getenv("WHATSAPP_RECIPIENT_PHONE"),
                        }
                    )
                )

            if os.getenv("TELEGRAM_BOT_TOKEN") and os.getenv("TELEGRAM_CHAT_ID"):
                channels.append(
                    TelegramChannel(
                        {
                            "botToken": os.getenv("TELEGRAM_BOT_TOKEN"),
                            "chatId": os.getenv("TELEGRAM_CHAT_ID"),
                        }
                    )
                )

            if os.getenv("DISCORD_WEBHOOK_URL"):
                channels.append(
                    DiscordChannel(
                        {
                            "webhookUrl": os.getenv("DISCORD_WEBHOOK_URL"),
                        }
                    )
                )

        return channels

    @classmethod
    async def log_delivery(cls, result: ChannelResult, payload: NotificationPayload):
        try:
            url = f"{cls.NEXT_API_BASE}/channels/logs"
            body = {
                "channelId": result.channel_id,
                "provider": result.provider,
                "title": payload.title,
                "message": payload.message,
                "severity": payload.severity,
                "status": "success" if result.success else "failed",
                "details": result.error or ("Delivered" if result.success else "Unknown"),
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                await client.post(url, json=body)
        except Exception:
            pass

    @classmethod
    async def dispatch_alert(
        cls,
        title: str,
        message: str,
        severity: str = "INFO",
        category: str = "general",
        url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        payload = NotificationPayload(
            title=title,
            message=message,
            severity=severity,
            category=category,
            url=url,
            metadata=metadata or {},
        )

        channels = await cls.load_configured_channels()
        if not channels:
            return {"dispatched": False, "results": [], "reason": "No configured active channels"}

        tasks = [ch.send(payload) for ch in channels]
        results: List[Any] = await asyncio.gather(*tasks, return_exceptions=True)

        final_results = []
        for i, res in enumerate(results):
            ch = channels[i]
            if isinstance(res, Exception):
                chan_res = ChannelResult(
                    success=False,
                    provider=ch.provider,
                    channel_id=ch.channel_id,
                    error=str(res),
                )
            else:
                chan_res = res

            final_results.append(chan_res.model_dump())
            asyncio.create_task(cls.log_delivery(chan_res, payload))

        return {
            "dispatched": True,
            "total_channels": len(channels),
            "successful": sum(1 for r in final_results if r["success"]),
            "results": final_results,
        }
