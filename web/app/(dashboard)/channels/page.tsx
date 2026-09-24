"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Send,
  MessageSquare,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";

interface ChannelConfig {
  id?: number;
  provider: "whatsapp" | "telegram" | "discord";
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  updatedAt?: string;
}

interface ChannelLog {
  id: number;
  provider: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  details?: string;
  createdAt: string;
}

export default function ChannelsPage() {
  const { theme } = useStore();
  const isDark = theme === "dark";

  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [logs, setLogs] = useState<ChannelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  // Form states
  const [waConfig, setWaConfig] = useState({
    name: "WhatsApp Radar",
    enabled: true,
    token: "",
    phoneNumberId: "",
    recipientPhone: "",
    useTemplate: false,
    templateName: "hello_world",
  });

  const [tgConfig, setTgConfig] = useState({
    name: "Telegram Radar Bot",
    enabled: true,
    botToken: "",
    chatId: "",
  });

  const [dcConfig, setDcConfig] = useState({
    name: "Discord Cyber Webhook",
    enabled: true,
    webhookUrl: "",
    username: "Spider-Sense Radar",
  });

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/channels");
      if (res.ok) {
        const json = await res.json();
        const data: ChannelConfig[] = json.data || [];
        setChannels(data);

        // Populate form fields if channels already exist
        data.forEach((ch) => {
          if (ch.provider === "whatsapp") {
            setWaConfig({
              name: ch.name || "WhatsApp Radar",
              enabled: ch.enabled,
              token: ch.config?.token || "",
              phoneNumberId: ch.config?.phoneNumberId || "",
              recipientPhone: ch.config?.recipientPhone || "",
              useTemplate: Boolean(ch.config?.useTemplate),
              templateName: ch.config?.templateName || "hello_world",
            });
          } else if (ch.provider === "telegram") {
            setTgConfig({
              name: ch.name || "Telegram Radar Bot",
              enabled: ch.enabled,
              botToken: ch.config?.botToken || "",
              chatId: ch.config?.chatId || "",
            });
          } else if (ch.provider === "discord") {
            setDcConfig({
              name: ch.name || "Discord Cyber Webhook",
              enabled: ch.enabled,
              webhookUrl: ch.config?.webhookUrl || "",
              username: ch.config?.username || "Spider-Sense Radar",
            });
          }
        });
      }
    } catch (err) {
      console.error("Failed to load channels:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/channels/logs");
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load channel logs:", err);
    }
  };

  useEffect(() => {
    Promise.all([fetchChannels(), fetchLogs()]).finally(() => setLoading(false));
  }, []);

  const handleSaveChannel = async (provider: "whatsapp" | "telegram" | "discord") => {
    setSavingProvider(provider);
    setTestResult(null);

    let payload: any = { provider };
    const existing = channels.find((c) => c.provider === provider);
    if (existing?.id) payload.id = existing.id;

    if (provider === "whatsapp") {
      payload.name = waConfig.name;
      payload.enabled = waConfig.enabled;
      payload.config = {
        token: waConfig.token,
        phoneNumberId: waConfig.phoneNumberId,
        recipientPhone: waConfig.recipientPhone,
        useTemplate: waConfig.useTemplate,
        templateName: waConfig.templateName,
      };
    } else if (provider === "telegram") {
      payload.name = tgConfig.name;
      payload.enabled = tgConfig.enabled;
      payload.config = {
        botToken: tgConfig.botToken,
        chatId: tgConfig.chatId,
      };
    } else if (provider === "discord") {
      payload.name = dcConfig.name;
      payload.enabled = dcConfig.enabled;
      payload.config = {
        webhookUrl: dcConfig.webhookUrl,
        username: dcConfig.username,
      };
    }

    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchChannels();
        setTestResult({
          provider,
          success: true,
          message: `Configuration for ${provider.toUpperCase()} saved successfully!`,
        });
      } else {
        const errData = await res.json();
        setTestResult({
          provider,
          success: false,
          message: `Save failed: ${errData.error || "Unknown error"}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        provider,
        success: false,
        message: `Network error: ${err.message}`,
      });
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTestChannel = async (provider: "whatsapp" | "telegram" | "discord") => {
    setTestingProvider(provider);
    setTestResult(null);

    let config: any = {};
    if (provider === "whatsapp") {
      config = {
        token: waConfig.token,
        phoneNumberId: waConfig.phoneNumberId,
        recipientPhone: waConfig.recipientPhone,
        useTemplate: waConfig.useTemplate,
        templateName: waConfig.templateName,
      };
    } else if (provider === "telegram") {
      config = {
        botToken: tgConfig.botToken,
        chatId: tgConfig.chatId,
      };
    } else if (provider === "discord") {
      config = {
        webhookUrl: dcConfig.webhookUrl,
        username: dcConfig.username,
      };
    }

    try {
      const res = await fetch("/api/channels/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config }),
      });

      const json = await res.json();
      const isSuccess = json.success;
      const errorMsg = json.result?.error || json.error;

      setTestResult({
        provider,
        success: isSuccess,
        message: isSuccess
          ? `Signal test delivered successfully to ${provider.toUpperCase()}!`
          : `Transmission failed: ${errorMsg || "Could not reach provider API"}`,
      });

      await fetchLogs();
    } catch (err: any) {
      setTestResult({
        provider,
        success: false,
        message: `Test ping network error: ${err.message}`,
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const activeCount = channels.filter((c) => c.enabled).length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Top Banner */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--depth)] border border-[var(--rim)] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Radio className="w-5 h-5 text-[var(--watchful)] animate-pulse" />
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
              Radar Transmitters & Alert Channels
            </h1>
          </div>
          <p className="text-xs text-[var(--ink-secondary)] max-w-2xl mt-0.5">
            Route live Spider-Sense signals instantly to your external messaging platforms whenever a product recall or
            detrimental Terms of Service change is detected.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-[var(--radius-sm)] border border-[var(--rim)] px-3 py-1.5 bg-[var(--surface)] text-xs font-mono">
            <span className="text-[var(--ink-tertiary)]">ACTIVE: </span>
            <span className="font-semibold text-[var(--clear)]">{activeCount} / 3 Online</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchChannels();
              fetchLogs();
            }}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Global Status Banner if test executed */}
      {testResult && (
        <div
          className={`rounded-[var(--radius-md)] border p-4 flex items-center justify-between transition-all ${
            testResult.success
              ? "bg-[var(--clear-fill)] border-[rgba(110,231,183,0.3)] text-[var(--clear)]"
              : "bg-[var(--alert-fill)] border-[rgba(248,113,113,0.3)] text-[var(--alert)]"
          }`}
        >
          <div className="flex items-center gap-3">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--clear)] shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[var(--alert)] shrink-0" />
            )}
            <div>
              <p className="font-medium text-xs">
                {testResult.provider} Transmit Result
              </p>
              <p className="text-xs font-mono mt-0.5">{testResult.message}</p>
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs underline cursor-pointer hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of 3 Providers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PROVIDER 1: WHATSAPP */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--clear-fill)] flex items-center justify-center border border-[rgba(110,231,183,0.25)]">
                    <MessageSquare className="w-4 h-4 text-[var(--clear)]" />
                  </div>
                  <CardTitle className="text-sm font-semibold tracking-tight">WhatsApp</CardTitle>
                </div>
                <Badge variant="outline" className="text-[9px]">1K Free / Mo</Badge>
              </div>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                Meta Cloud Graph API v22.0. Direct WhatsApp alerts to personal or test numbers.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between p-2 border border-black/20 bg-[var(--input-bg)] rounded">
                <span className="text-xs font-bold font-mono">CHANNEL ENABLED</span>
                <input
                  type="checkbox"
                  checked={waConfig.enabled}
                  onChange={(e) => setWaConfig({ ...waConfig, enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--subtext)] font-bold">
                  Access Token (Bearer)
                </label>
                <Input
                  type="password"
                  placeholder="EAAG... (Meta Cloud API Token)"
                  value={waConfig.token}
                  onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                  className="text-xs mt-0.5"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--subtext)] font-bold">
                  Phone Number ID
                </label>
                <Input
                  placeholder="e.g. 893308493870482"
                  value={waConfig.phoneNumberId}
                  onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })}
                  className="text-xs mt-0.5"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--subtext)] font-bold">
                  Recipient Phone Number
                </label>
                <Input
                  placeholder="e.g. +919876543210"
                  value={waConfig.recipientPhone}
                  onChange={(e) => setWaConfig({ ...waConfig, recipientPhone: e.target.value })}
                  className="text-xs mt-0.5"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedGuide(expandedGuide === "whatsapp" ? null : "whatsapp")}
                  className="text-[11px] font-mono text-[var(--sv-yellow)] hover:underline flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  {expandedGuide === "whatsapp" ? "Hide Setup Guide" : "How to get free Meta Token?"}
                  {expandedGuide === "whatsapp" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {expandedGuide === "whatsapp" && (
                  <div className="mt-2 p-2.5 bg-black/40 border border-black/30 text-[10px] font-mono space-y-1 rounded text-neutral-300">
                    <p className="font-bold text-white">Meta Developer Free Sandbox:</p>
                    <p>1. Go to developers.facebook.com &gt; My Apps &gt; WhatsApp &gt; API Setup.</p>
                    <p>2. Copy the Temporary Access Token &amp; Phone Number ID.</p>
                    <p>3. Add your phone number to &quot;To&quot; recipient list to test free without a credit card.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          <div className="p-4 pt-0 flex gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={savingProvider === "whatsapp"}
              onClick={() => handleSaveChannel("whatsapp")}
              className="flex-1 text-xs border-2 border-black font-bold"
            >
              {savingProvider === "whatsapp" ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="yellow"
              size="sm"
              disabled={testingProvider === "whatsapp" || !waConfig.token || !waConfig.recipientPhone}
              onClick={() => handleTestChannel("whatsapp")}
              className="flex-1 text-xs border-2 border-black font-bold gap-1"
            >
              <Send className="w-3 h-3" />
              {testingProvider === "whatsapp" ? "Sending..." : "Test Ping"}
            </Button>
          </div>
        </Card>

        {/* PROVIDER 2: TELEGRAM */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--watchful-fill)] flex items-center justify-center border border-[rgba(196,181,253,0.3)]">
                    <Bot className="w-4 h-4 text-[var(--watchful)]" />
                  </div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Telegram</CardTitle>
                </div>
                <Badge variant="outline" className="text-[9px]">100% Free</Badge>
              </div>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                Zero fees, unlimited alerts via Telegram Bot API with Markdown styling.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between p-2 border border-black/20 bg-[var(--input-bg)] rounded">
                <span className="text-xs font-bold font-mono">CHANNEL ENABLED</span>
                <input
                  type="checkbox"
                  checked={tgConfig.enabled}
                  onChange={(e) => setTgConfig({ ...tgConfig, enabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--subtext)] font-bold">
                  Bot Token (from @BotFather)
                </label>
                <Input
                  type="password"
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={tgConfig.botToken}
                  onChange={(e) => setTgConfig({ ...tgConfig, botToken: e.target.value })}
                  className="text-xs mt-0.5"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--subtext)] font-bold">
                  Target Chat ID / Channel ID
                </label>
                <Input
                  placeholder="e.g. 192837465 or @my_alert_channel"
                  value={tgConfig.chatId}
                  onChange={(e) => setTgConfig({ ...tgConfig, chatId: e.target.value })}
                  className="text-xs mt-0.5"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedGuide(expandedGuide === "telegram" ? null : "telegram")}
                  className="text-[11px] font-mono text-[var(--sv-yellow)] hover:underline flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  {expandedGuide === "telegram" ? "Hide Setup Guide" : "1-Minute Setup Guide"}
                  {expandedGuide === "telegram" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {expandedGuide === "telegram" && (
                  <div className="mt-2 p-2.5 bg-black/40 border border-black/30 text-[10px] font-mono space-y-1 rounded text-neutral-300">
                    <p className="font-bold text-white">How to create in 60 seconds:</p>
                    <p>1. Open Telegram, search `@BotFather`, send `/newbot`.</p>
                    <p>2. Copy the token provided into the Bot Token field.</p>
                    <p>3. Message `@userinfobot` to get your numeric Chat ID.</p>
                    <p>4. Send `/start` to your new bot once, then click Test Ping!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          <div className="p-4 pt-0 flex gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={savingProvider === "telegram"}
              onClick={() => handleSaveChannel("telegram")}
              className="flex-1 text-xs border-2 border-black font-bold"
            >
              {savingProvider === "telegram" ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="cyan"
              size="sm"
              disabled={testingProvider === "telegram" || !tgConfig.botToken || !tgConfig.chatId}
              onClick={() => handleTestChannel("telegram")}
              className="flex-1 text-xs border-2 border-black font-bold gap-1"
            >
              <Send className="w-3 h-3" />
              {testingProvider === "telegram" ? "Sending..." : "Test Ping"}
            </Button>
          </div>
        </Card>

        {/* PROVIDER 3: DISCORD */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--watchful-fill)] flex items-center justify-center border border-[rgba(196,181,253,0.3)]">
                    <Zap className="w-4 h-4 text-[var(--watchful)]" />
                  </div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Discord</CardTitle>
                </div>
                <Badge variant="outline" className="text-[9px]">Webhooks</Badge>
              </div>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                Instant webhook delivery with clean Spider-Sense color-coded cards.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between p-2 border border-black/20 bg-[var(--input-bg)] rounded">
                <span className="text-xs font-bold font-mono">CHANNEL ENABLED</span>
                <input
                  type="checkbox"
                  checked={dcConfig.enabled}
                  onChange={(e) => setDcConfig({ ...dcConfig, enabled: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--subtext)] font-bold">
                  Discord Webhook URL
                </label>
                <Input
                  type="password"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={dcConfig.webhookUrl}
                  onChange={(e) => setDcConfig({ ...dcConfig, webhookUrl: e.target.value })}
                  className="text-xs mt-0.5"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--subtext)] font-bold">
                  Transmitter Bot Name
                </label>
                <Input
                  placeholder="Spider-Sense Radar"
                  value={dcConfig.username}
                  onChange={(e) => setDcConfig({ ...dcConfig, username: e.target.value })}
                  className="text-xs mt-0.5"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedGuide(expandedGuide === "discord" ? null : "discord")}
                  className="text-[11px] font-mono text-[var(--sv-yellow)] hover:underline flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  {expandedGuide === "discord" ? "Hide Setup Guide" : "10-Second Setup Guide"}
                  {expandedGuide === "discord" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {expandedGuide === "discord" && (
                  <div className="mt-2 p-2.5 bg-black/40 border border-black/30 text-[10px] font-mono space-y-1 rounded text-neutral-300">
                    <p className="font-bold text-white">How to create Webhook URL:</p>
                    <p>1. In your Discord server, right click your desired channel &gt; Edit Channel.</p>
                    <p>2. Select Integrations &gt; Webhooks &gt; New Webhook.</p>
                    <p>3. Click &quot;Copy Webhook URL&quot; and paste it above!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          <div className="p-4 pt-0 flex gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={savingProvider === "discord"}
              onClick={() => handleSaveChannel("discord")}
              className="flex-1 text-xs border-2 border-black font-bold"
            >
              {savingProvider === "discord" ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="magenta"
              size="sm"
              disabled={testingProvider === "discord" || !dcConfig.webhookUrl}
              onClick={() => handleTestChannel("discord")}
              className="flex-1 text-xs border-2 border-black font-bold gap-1"
            >
              <Send className="w-3 h-3" />
              {testingProvider === "discord" ? "Sending..." : "Test Ping"}
            </Button>
          </div>
        </Card>
      </div>

      {/* RECENT TRANSMISSION LOGS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--watchful)]" /> Recent Transmission Audit Log
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Real-time delivery confirmation records dispatched to WhatsApp, Telegram, and Discord.
            </CardDescription>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLogs}
            className="text-xs"
          >
            Refresh Logs
          </Button>
        </CardHeader>

        <CardContent>
          {logs.length === 0 ? (
            <div className="border-2 border-dashed border-black/30 p-6 text-center text-xs font-mono text-[var(--subtext)]">
              NO TRANSMISSIONS LOGGED YET. CONFIGURE A CHANNEL AND PRESS &quot;TEST PING&quot; ABOVE.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-[var(--input-bg)] text-left">
                    <th className="p-2.5">TIME</th>
                    <th className="p-2.5">PROVIDER</th>
                    <th className="p-2.5">SEVERITY</th>
                    <th className="p-2.5">TITLE</th>
                    <th className="p-2.5">STATUS</th>
                    <th className="p-2.5">DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-black/10 hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="p-2.5 text-[var(--subtext)] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 uppercase font-bold">
                        <span
                          className={`px-1.5 py-0.5 border border-black text-[10px] rounded ${
                            log.provider === "whatsapp"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : log.provider === "telegram"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-indigo-500/20 text-indigo-400"
                          }`}
                        >
                          {log.provider}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold ${
                            log.severity === "CRITICAL"
                              ? "text-red-400 bg-red-500/10"
                              : log.severity === "WARNING"
                              ? "text-yellow-400 bg-yellow-500/10"
                              : "text-blue-400 bg-blue-500/10"
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-2.5 font-sans font-bold max-w-[200px] truncate">{log.title}</td>
                      <td className="p-2.5">
                        {log.status === "success" ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> OK
                          </span>
                        ) : (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-[var(--subtext)] max-w-[220px] truncate">{log.details || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
