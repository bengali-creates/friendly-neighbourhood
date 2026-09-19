import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from channels.base import NotificationPayload, ChannelResult
from channels.whatsapp import WhatsAppChannel
from channels.telegram import TelegramChannel
from channels.discord import DiscordChannel
from channels.router import ChannelRouter


@pytest.mark.asyncio
async def test_whatsapp_formatting_and_send():
    config = {
        "token": "test_token_123",
        "phoneNumberId": "893308493870482",
        "recipientPhone": "+1234567890",
        "apiVersion": "v22.0",
    }
    channel = WhatsAppChannel(config, channel_id=1)
    payload = NotificationPayload(
        title="Critical Recall Notice",
        message="Battery overheating risk detected.",
        severity="CRITICAL",
        category="recall",
        url="https://cpsc.gov/recall/123",
    )

    formatted = channel.format_message_body(payload)
    assert "SPIDER-SENSE ALERT" in formatted
    assert "Critical Recall Notice" in formatted
    assert "cpsc.gov" in formatted

    from unittest.mock import MagicMock
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"messages": [{"id": "wamid.12345"}]}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        res = await channel.send(payload)
        assert res.success is True
        assert res.provider == "whatsapp"
        assert res.message_id == "wamid.12345"


@pytest.mark.asyncio
async def test_telegram_formatting_and_send():
    config = {
        "botToken": "123456:ABC-DEF",
        "chatId": "987654321",
    }
    channel = TelegramChannel(config, channel_id=2)
    payload = NotificationPayload(
        title="Terms of Service Alteration",
        message="Mandatory arbitration added to clause 14.",
        severity="WARNING",
        category="tos",
    )

    formatted = channel.format_telegram_message(payload)
    assert "SPIDER-SENSE [WARNING]" in formatted
    assert "Terms of Service Alteration" in formatted

    from unittest.mock import MagicMock
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"ok": True, "result": {"message_id": 9999}}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        res = await channel.send(payload)
        assert res.success is True
        assert res.provider == "telegram"
        assert res.message_id == "9999"


@pytest.mark.asyncio
async def test_discord_embed_and_send():
    config = {
        "webhookUrl": "https://discord.com/api/webhooks/123/abc",
        "username": "Spider Radar",
    }
    channel = DiscordChannel(config, channel_id=3)
    payload = NotificationPayload(
        title="Civic Notice Update",
        message="Subsidy deadline extended.",
        severity="INFO",
        category="civic",
        url="https://civic.gov/subsidy",
    )

    embed = channel.build_embed(payload)
    assert embed["title"] == "Civic Notice Update"
    assert embed["color"] == 0x00F0FF

    from unittest.mock import MagicMock
    mock_resp = MagicMock()
    mock_resp.status_code = 204
    mock_resp.text = ""

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        res = await channel.send(payload)
        assert res.success is True
        assert res.provider == "discord"


@pytest.mark.asyncio
async def test_channel_router_dispatch():
    ch1 = WhatsAppChannel({"token": "t", "phoneNumberId": "p", "recipientPhone": "123"})
    ch2 = TelegramChannel({"botToken": "b", "chatId": "c"})
    ch3 = DiscordChannel({"webhookUrl": "https://discord.com/api/webhooks/test"})

    with patch.object(ChannelRouter, "load_configured_channels", return_value=[ch1, ch2, ch3]):
        with patch.object(ch1, "send", return_value=ChannelResult(success=True, provider="whatsapp")):
            with patch.object(ch2, "send", return_value=ChannelResult(success=True, provider="telegram")):
                with patch.object(ch3, "send", return_value=ChannelResult(success=True, provider="discord")):
                    with patch.object(ChannelRouter, "log_delivery", return_value=None):
                        dispatch_res = await ChannelRouter.dispatch_alert(
                            title="System Test",
                            message="Multi-channel transmission test",
                            severity="INFO",
                        )
                        assert dispatch_res["dispatched"] is True
                        assert dispatch_res["total_channels"] == 3
                        assert dispatch_res["successful"] == 3
