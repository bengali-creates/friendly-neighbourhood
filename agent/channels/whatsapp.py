import os
import httpx
from typing import Dict, Any, Optional
from .base import BaseChannel, NotificationPayload, ChannelResult


class WhatsAppChannel(BaseChannel):
    def __init__(self, config: Dict[str, Any], channel_id: Optional[int] = None):
        super().__init__("whatsapp", config, channel_id)
        self.token = config.get("token") or os.getenv("WHATSAPP_TOKEN", "")
        self.phone_number_id = config.get("phoneNumberId") or os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        self.recipient_phone = config.get("recipientPhone") or os.getenv("WHATSAPP_RECIPIENT_PHONE", "")
        self.api_version = config.get("apiVersion", "v22.0")
        self.use_template = config.get("useTemplate", False)
        self.template_name = config.get("templateName", "hello_world")

    def format_message_body(self, payload: NotificationPayload) -> str:
        lines = [
            f"[SPIDER-SENSE ALERT] [{payload.severity}]",
            f"*{payload.title}*",
            "",
            payload.message,
        ]
        if payload.url:
            lines.append(f"\nSource: {payload.url}")
        lines.append(f"\nRadar Type: {payload.category.upper()}")
        return "\n".join(lines)

    async def send(self, payload: NotificationPayload) -> ChannelResult:
        if not self.token or not self.phone_number_id or not self.recipient_phone:
            return ChannelResult(
                success=False,
                provider="whatsapp",
                channel_id=self.channel_id,
                error="Missing WhatsApp configuration (token, phoneNumberId, or recipientPhone).",
            )

        endpoint = f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

        clean_phone = self.recipient_phone.replace("+", "").replace("-", "").replace(" ", "")

        if self.use_template:
            body_data = {
                "messaging_product": "whatsapp",
                "to": clean_phone,
                "type": "template",
                "template": {
                    "name": self.template_name,
                    "language": {"code": "en_US"},
                },
            }
        else:
            body_data = {
                "messaging_product": "whatsapp",
                "to": clean_phone,
                "type": "text",
                "text": {"body": self.format_message_body(payload)},
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(endpoint, json=body_data, headers=headers)
                data = res.json()

                if res.status_code in (200, 201):
                    msg_id = data.get("messages", [{}])[0].get("id") if "messages" in data else None
                    return ChannelResult(
                        success=True,
                        provider="whatsapp",
                        channel_id=self.channel_id,
                        message_id=msg_id,
                        raw_response=data,
                    )
                else:
                    err_msg = data.get("error", {}).get("message", f"HTTP {res.status_code}")
                    return ChannelResult(
                        success=False,
                        provider="whatsapp",
                        channel_id=self.channel_id,
                        error=f"WhatsApp API error: {err_msg}",
                        raw_response=data,
                    )
        except Exception as e:
            return ChannelResult(
                success=False,
                provider="whatsapp",
                channel_id=self.channel_id,
                error=f"Network error sending WhatsApp alert: {str(e)}",
            )
