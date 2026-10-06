import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, config, channelId } = body;

    if (!provider || !config) {
      return NextResponse.json(
        { success: false, error: "Provider and config are required for test transmission." },
        { status: 400 }
      );
    }

    try {
      const fastApiRes = await fetch("http://localhost:8000/channels/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          config,
          channel_id: channelId,
        }),
      });

      if (fastApiRes.ok) {
        const json = await fastApiRes.json();
        return NextResponse.json(json);
      }
    } catch {
      // Fallback to direct request if agent is unreachable
    }

    const prov = provider.toLowerCase();
    if (prov === "discord") {
      const webhookUrl = config.webhookUrl;
      if (!webhookUrl) throw new Error("Discord Webhook URL is missing.");

      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Spider-Sense Radar",
          embeds: [
            {
              title: "Spider-Sense Signal Test",
              description: "Transmitter online! Real-time radar alert channel verified successfully.",
              color: 0x00f0ff,
              fields: [
                { name: "Severity", value: "`INFO`", inline: true },
                { name: "Sector", value: "`CHANNEL_TEST`", inline: true },
              ],
              footer: { text: "Spider-Sense Control Room" },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (discordRes.ok || discordRes.status === 204) {
        return NextResponse.json({
          success: true,
          result: { success: true, provider: "discord", raw_response: { status: discordRes.status } },
        });
      } else {
        const errText = await discordRes.text();
        return NextResponse.json({
          success: false,
          result: { success: false, provider: "discord", error: `Discord HTTP ${discordRes.status}: ${errText}` },
        });
      }
    } else if (prov === "telegram") {
      const { botToken, chatId } = config;
      if (!botToken || !chatId) throw new Error("Telegram botToken or chatId is missing.");

      const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const tgRes = await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "*SPIDER-SENSE SIGNAL TEST*\n\nTransmitter online! Real-time radar alert channel verified successfully.\n\nSector: `CHANNEL_TEST`",
          parse_mode: "Markdown",
        }),
      });

      const tgData = await tgRes.json();
      return NextResponse.json({
        success: Boolean(tgData.ok),
        result: {
          success: Boolean(tgData.ok),
          provider: "telegram",
          error: tgData.ok ? null : tgData.description,
          raw_response: tgData,
        },
      });
    } else if (prov === "whatsapp") {
      const { token, phoneNumberId, recipientPhone, apiVersion = "v22.0" } = config;
      if (!token || !phoneNumberId || !recipientPhone) {
        throw new Error("WhatsApp token, phoneNumberId, or recipientPhone is missing.");
      }

      const cleanPhone = recipientPhone.replace(/[+\-\s]/g, "");
      const waUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      const waRes = await fetch(waUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: {
            body: "*SPIDER-SENSE SIGNAL TEST*\n\nTransmitter online! Real-time radar alert channel verified successfully.",
          },
        }),
      });

      const waData = await waRes.json();
      const isSuccess = waRes.status === 200 || waRes.status === 201;
      return NextResponse.json({
        success: isSuccess,
        result: {
          success: isSuccess,
          provider: "whatsapp",
          error: isSuccess ? null : waData?.error?.message || `HTTP ${waRes.status}`,
          raw_response: waData,
        },
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported channel provider: ${provider}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
