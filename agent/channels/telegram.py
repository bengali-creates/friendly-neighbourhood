import os
import httpx
from typing import Dict, Any, Optional
from .base import BaseChannel, NotificationPayload, ChannelResult


class TelegramChannel(BaseChannel):
    def __init__(self, config: Dict[str, Any], channel_id: Optional[int] = None):
        super().__init__("telegram", config, channel_id)
        self.bot_token = config.get("botToken") or os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.chat_id = config.get("chatId") or os.getenv("TELEGRAM_CHAT_ID", "")

    def format_telegram_message(self, payload: NotificationPayload) -> str:
        lines = [
            f"*SPIDER-SENSE [{payload.severity}]*",
            f"*{payload.title}*",
            "",
            payload.message,
            "",
            f"*Radar Sector:* `{payload.category.upper()}`",
        ]
        if payload.url:
            lines.append(f"[Inspect Origin Resource]({payload.url})")
        return "\n".join(lines)

    async def send(self, payload: NotificationPayload) -> ChannelResult:
        if not self.bot_token or not self.chat_id:
            return ChannelResult(
                success=False,
                provider="telegram",
                channel_id=self.channel_id,
                error="Missing Telegram configuration (botToken or chatId).",
            )

        endpoint = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        body = {
            "chat_id": self.chat_id,
            "text": self.format_telegram_message(payload),
            "parse_mode": "Markdown",
            "disable_web_page_preview": False,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(endpoint, json=body)
                data = res.json()

                if data.get("ok"):
                    msg_id = str(data.get("result", {}).get("message_id"))
                    return ChannelResult(
                        success=True,
                        provider="telegram",
                        channel_id=self.channel_id,
                        message_id=msg_id,
                        raw_response=data,
                    )
                else:
                    err_desc = data.get("description", f"Telegram error (HTTP {res.status_code})")
                    return ChannelResult(
                        success=False,
                        provider="telegram",
                        channel_id=self.channel_id,
                        error=err_desc,
                        raw_response=data,
                    )
        except Exception as e:
            return ChannelResult(
                success=False,
                provider="telegram",
                channel_id=self.channel_id,
                error=f"Network error communicating with Telegram API: {str(e)}",
            )
