"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  useAlerts,
  useCollectors,
  useWatchUrl,
  useRunAgent,
} from "@/lib/queries";
import { useStore } from "@/lib/store";
import AlertDrawer from "@/components/AlertDrawer";
import {
  Shield,
  Zap,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Terminal,
  Plus,
  CheckCircle2,
  Play,
} from "lucide-react";

export default function OneStopComicDashboard() {
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();
  const { data: collectorsData, isLoading: collectorsLoading } =
    useCollectors();
  const { openAlert, flash, setAgentStatus, agentStatus } = useStore();
  const watch = useWatchUrl();
  const runAgent = useRunAgent();

  const alerts = alertsData?.data ?? [];
  const collectors = collectorsData?.data ?? [];

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState("tos");

  const handleAddWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    flash(`Adding ${name || url} to watch list…`);
    await watch.mutateAsync({
      url,
      name: name || url,
      source_type: sourceType,
      prompt: "Extract main policy clauses and terms.",
    });
    flash(`✓ ${name || url} added to radar!`);
    setUrl("");
    setName("");
  };

  const handleScan = async (c: any) => {
    setAgentStatus("running");
    flash(`Scanning ${c.name}…`);
    try {
      await runAgent.mutateAsync({
        collector_id: c.collectorId,
        url: c.url,
        source_type: c.sourceType,
      });
      setAgentStatus("idle");
      flash(`✓ ${c.name} scan complete`);
    } catch {
      setAgentStatus("error");
      flash(`✗ Error scanning ${c.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EBD9] text-[#0B0714] font-sans p-4 md:p-8 relative z-10 selection:bg-[var(--sv-magenta)] selection:text-white">
      <header className="comic-panel comic-panel--cream mb-8 border-4 border-[#0B0714] shadow-[8px_8px_0_#0B0714] text-center relative overflow-hidden py-8 px-4">
        <div className="absolute top-2 left-4 font-['Bangers'] text-4xl text-[var(--sv-magenta)] opacity-20 pointer-events-none -rotate-12">
          THWIP!
        </div>
        <div className="absolute bottom-2 right-4 font-['Bangers'] text-4xl text-[var(--sv-cyan)] opacity-20 pointer-events-none rotate-12">
          ALERT!
        </div>

        <h1
          className="font-['Bangers'] text-6xl md:text-8xl tracking-wider text-white drop-shadow-[5px_5px_0_#0B0714] inline-block misreg"
          data-text="SPIDER-SENSE"
        >
          SPIDER-SENSE
        </h1>
        <p className="font-['Archivo_Black'] text-xs md:text-sm tracking-widest text-[#0B0714] uppercase mt-2">
          PERSONAL AI RADAR • AUTONOMOUS AGENTIC MONITORING
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        <section className="lg:col-span-4 comic-panel bg-white border-3 border-[#0B0714] shadow-[6px_6px_0_#0B0714] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-3">
            <div>
              <h2 className="font-['Bangers'] text-2xl tracking-wide text-[#0B0714]">
                THINGS I OWN
              </h2>
              <p className="text-[11px] font-sans text-[#0B0714]/70">
                Inventory user products
              </p>
            </div>
            <span className="caption caption--cyan">CPSC RECALL</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <InventoryRow name="Anker PowerBank 537" status="ALERT" />
            <InventoryRow name="LG Smart Refrigerator" status="CLEAR" />
            <InventoryRow name="Tesla Model 3 Charger" status="CLEAR" />
            <InventoryRow name="Dyson V11 Vacuum" status="ALERT" />
            <InventoryRow name="Dorlight Smart Hub" status="CLEAR" />
          </div>

          <div className="mt-auto pt-3 border-t-2 border-[#0B0714]/20 flex items-center justify-between text-xs font-mono">
            <span className="font-bold">STATUS:</span>
            <span className="badge badge--warning">
              2 RECALL ALERTS DETECTED
            </span>
          </div>
        </section>

        <section className="lg:col-span-4 comic-panel bg-white border-3 border-[#0B0714] shadow-[6px_6px_0_#0B0714] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-3">
            <div>
              <h2 className="font-['Bangers'] text-2xl tracking-wide text-[#0B0714]">
                SERVICES I USE
              </h2>
              <p className="text-[11px] font-sans text-[#0B0714]/70">
                ToS monitoring & scraper status
              </p>
            </div>
            <span className="caption">POLICY DIFF</span>
          </div>

          <form
            onSubmit={handleAddWatch}
            className="flex flex-col gap-2 p-2.5 bg-[#F4EBD9] border-2 border-[#0B0714]"
          >
            <input
              className="input text-xs"
              placeholder="Add URL (e.g. https://instagram.com/legal/terms)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input
                className="input text-xs flex-1"
                placeholder="Label / Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="btn btn--primary text-xs py-1 px-3"
                type="submit"
                disabled={watch.isPending}
              >
                + Add
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {collectorsLoading && (
              <p className="text-xs font-mono opacity-50">Loading services…</p>
            )}
            {collectors.length === 0 && !collectorsLoading && (
              <div className="p-3 text-xs font-mono opacity-60 text-center">
                No active collectors yet. Add a URL above.
              </div>
            )}
            {collectors.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 bg-[#F4EBD9] border-2 border-[#0B0714]"
              >
                <Link
                  href={`/scrapers/${c.collectorId}`}
                  className="min-w-0 pr-2 group"
                >
                  <p className="font-['Archivo_Black'] text-xs text-[#0B0714] group-hover:text-[#FF2E63] truncate">
                    {c.name}
                  </p>
                  <p className="text-[10px] font-mono opacity-60 truncate">
                    {c.url}
                  </p>
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href={`/scrapers/${c.collectorId}`}>
                    <button className="btn btn--cyan text-[10px] py-1 px-2 shrink-0">
                      View
                    </button>
                  </Link>
                  <button
                    className="btn btn--yellow text-[10px] py-1 px-2.5 shrink-0"
                    onClick={() => handleScan(c)}
                    disabled={runAgent.isPending}
                  >
                    <Play className="w-3 h-3 inline mr-1" /> Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 comic-panel bg-white border-3 border-[#0B0714] shadow-[6px_6px_0_#0B0714] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-3">
            <div>
              <h2 className="font-['Bangers'] text-2xl tracking-wide text-[#0B0714]">
                ACTIVITY FEED
              </h2>
              <p className="text-[11px] font-sans text-[#0B0714]/70">
                Live policy & recall changes
              </p>
            </div>
            <span className="badge badge--critical">LIVE RADAR</span>
          </div>

          {alertsLoading && (
            <p className="text-xs font-mono opacity-50">
              Loading radar alerts…
            </p>
          )}

          <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
            {alerts.length === 0 && !alertsLoading && (
              <div className="comic-panel bg-[#F4EBD9] text-center p-6 border-2 border-dashed border-[#0B0714]">
                <div className="ono text-4xl mb-2">THWIP!</div>
                <p className="font-['Archivo_Black'] text-xs uppercase text-[#0B0714]">
                  Radar Scanning • All Clear
                </p>
              </div>
            )}

            {alerts.map((alert: any) => (
              <button
                key={alert.id}
                onClick={() => openAlert(alert)}
                className="text-left comic-panel bg-[#F4EBD9] border-2 border-[#0B0714] p-3 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0B0714] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`badge ${alert.severity === "CRITICAL" ? "badge--critical" : "badge--warning"}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="font-sans text-xs font-bold text-[#0B0714] leading-snug group-hover:text-[var(--sv-magenta)] transition-colors">
                  {alert.message}
                </p>
                <div className="caption caption--yellow mt-2 text-[9px]">
                  Click to view positions A/B & script
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-6 comic-panel bg-white border-3 border-[#0B0714] shadow-[6px_6px_0_#0B0714] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-3">
            <div>
              <h2 className="font-['Bangers'] text-2xl tracking-wide text-[#0B0714]">
                SCRAPER HEALTH
              </h2>
              <p className="text-[11px] font-sans text-[#0B0714]/70">
                Bright Data Scraper Studio self-healing log
              </p>
            </div>
            <span className="caption caption--cyan">AUTO-REPAIR</span>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0B0714] text-white border-2 border-[#0B0714] flex items-center justify-between">
              <div>
                <span className="text-[var(--sv-yellow)] font-bold">
                  pipeline → beaton
                </span>
                <p className="text-[10px] text-white/60">
                  DOM selector mutation detected
                </p>
              </div>
              <span className="badge badge--broken">BROKEN</span>
            </div>

            <div className="p-3 bg-[var(--sv-purple)] text-white border-2 border-[#0B0714] flex items-center justify-between">
              <div>
                <span className="text-white font-bold">pipeline → hatling</span>
                <p className="text-[10px] text-white/80">
                  Bright Data AI self-healed selector
                </p>
              </div>
              <span className="badge badge--healed">HEALED</span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 comic-panel bg-white border-3 border-[#0B0714] shadow-[6px_6px_0_#0B0714] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-3">
            <div>
              <h2 className="font-['Bangers'] text-2xl tracking-wide text-[#0B0714]">
                AGENTIC AI
              </h2>
              <p className="text-[11px] font-sans text-[#0B0714]/70">
                Gemini 3.6 Flash policy analyzer & draft generator
              </p>
            </div>
            <span className="caption caption--red">ACTIVE BRAIN</span>
          </div>

          <div className="p-4 bg-[#0B0714] text-[#00E5FF] border-2 border-[#0B0714] font-mono text-xs leading-relaxed min-h-[120px]">
            <p className="text-white/80 mb-2">
              An autonomous agent is at work, drafting cancellation scripts &
              legal stance summaries for monitored services.
            </p>
            <div className="caption caption--yellow text-[10px] text-black">
              Drafting cancellation script & opt-out templates…
            </div>
          </div>
        </section>
      </div>

      <AlertDrawer />
    </div>
  );
}

function InventoryRow({
  name,
  status,
}: {
  name: string;
  status: "CLEAR" | "ALERT";
}) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-[#F4EBD9] border-2 border-[#0B0714]">
      <span className="font-['Archivo_Black'] text-xs text-[#0B0714]">
        {name}
      </span>
      <span
        className={`badge ${status === "ALERT" ? "badge--critical" : "badge--healed"}`}
      >
        {status}
      </span>
    </div>
  );
}
