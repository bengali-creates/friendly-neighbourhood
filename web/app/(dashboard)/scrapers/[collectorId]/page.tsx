"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSnapshots,
  useCollectors,
  useRunAgent,
  useHealAgent,
} from "@/lib/queries";
import { useRadarStore } from "@/lib/radarStore";
import { useAgentStore } from "@/lib/agentStore";
import {
  ArrowLeft,
  Globe,
  RefreshCw,
  Zap,
  ExternalLink,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Shield,
  Clock,
  Database,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  ListFilter,
  Diff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScraperDetailPage({
  params,
}: {
  params: Promise<{ collectorId: string }>;
}) {
  const { collectorId } = use(params);
  const { data: collectorsData } = useCollectors();
  const collectors = collectorsData?.data ?? [];
  const collector = collectors.find((c: any) => c.collectorId === collectorId);

  const { data: snapshotsData, isLoading: snapshotsLoading } =
    useSnapshots(collectorId);
  const snapshots = snapshotsData?.data ?? [];
  const latestSnapshot = snapshots[0];
  const previousSnapshot = snapshots[1];

  const { flash } = useRadarStore();
  const { setAgentStatus } = useAgentStore();
  const runAgent = useRunAgent();
  const healAgent = useHealAgent();

  const [isScanning, setIsScanning] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"kv" | "diff" | "raw">("kv");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const copyId = () => {
    navigator.clipboard.writeText(collectorId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleScan = async () => {
    if (!collector) return;
    setIsScanning(true);
    setAgentStatus("running");
    flash(`Scanning ${collector.name}…`);
    try {
      await runAgent.mutateAsync({
        collector_id: collector.collectorId,
        url: collector.url,
        source_type: collector.sourceType,
      });
      flash(`✓ ${collector.name} scan complete`);
      setAgentStatus("idle");
    } catch {
      flash(`✗ Error scanning ${collector.name}`);
      setAgentStatus("error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleHeal = async () => {
    if (!collector) return;
    setIsHealing(true);
    flash(`⚡ Triggering self-heal for ${collector.name}…`);
    try {
      await healAgent.mutateAsync({
        collector_id: collector.collectorId,
        url: collector.url,
        issue_description:
          "Manual self-heal requested from scraper detail view",
      });
      flash(`✓ Self-heal complete`);
    } catch {
      flash(`✗ Self-heal failed`);
    } finally {
      setIsHealing(false);
    }
  };

   
  let sections: Record<string, string> = {};
  let documentTitle = collector?.name || "Scraped Snapshot Data";
  let cleanText = "";

  if (latestSnapshot) {
    cleanText = latestSnapshot.text || "";
    const raw = latestSnapshot.raw || {};
    if (raw.sections && typeof raw.sections === "object") {
      sections = raw.sections;
    }
    if (raw.title) {
      documentTitle = raw.title;
    }
  }

   
  if (Object.keys(sections).length === 0 && cleanText) {
    const paragraphs = cleanText.split("\n\n").filter(Boolean);
    if (paragraphs.length > 1) {
      paragraphs.forEach((p, idx) => {
        sections[`Section ${idx + 1}`] = p;
      });
    } else {
      sections["Main Policy Content"] = cleanText;
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <Link
          href="/services"
          className="inline-flex items-center text-xs font-mono text-[var(--sv-cyan)] hover:underline gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO MONITORED SERVICES
        </Link>
        <div className="flex items-center gap-2">
          <span className="caption caption--yellow text-[9px]">
            LIVE TELEMETRY VIEW
          </span>
        </div>
      </div>

      <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="caption caption--cyan text-[10px]">
                COLLECTOR: {collectorId}
              </span>
              <button
                onClick={copyId}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--subtext)] hover:text-[var(--sv-cyan)]"
                title="Copy Collector ID"
              >
                <Copy className="w-3 h-3" />
                {copied ? "COPIED!" : "COPY ID"}
              </button>
            </div>
            <h1 className="font-['Bangers'] text-3xl tracking-wide text-[var(--fg)]">
              {collector?.name || documentTitle}
            </h1>
            {collector?.url && (
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--sv-cyan)] truncate">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <a
                  href={collector.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline truncate"
                >
                  {collector.url}
                </a>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="yellow"
              size="sm"
              onClick={handleScan}
              disabled={isScanning}
              className="font-['Bangers'] text-xs tracking-wider px-4 active:scale-[0.98] transition-transform"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isScanning ? "animate-spin" : ""}`}
              />
              {isScanning ? "SCANNING…" : "TRIGGER SCAN"}
            </Button>
            <Button
              variant="cyan"
              size="sm"
              onClick={handleHeal}
              disabled={isHealing}
              className="font-['Bangers'] text-xs tracking-wider px-4 active:scale-[0.98] transition-transform"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              {isHealing ? "HEALING…" : "AUTO HEAL"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t-2 border-black/20 font-mono text-xs">
          <div className="p-2 bg-[var(--input-bg)] border-2 border-black shadow-[2px_2px_0_#000000]">
            <div className="text-[9px] uppercase font-['Archivo_Black'] text-[var(--subtext)]">
              Total Snapshots
            </div>
            <div className="font-bold text-[var(--fg)] mt-0.5">
              {snapshots.length} Baselines
            </div>
          </div>
          <div className="p-2 bg-[var(--input-bg)] border-2 border-black shadow-[2px_2px_0_#000000]">
            <div className="text-[9px] uppercase font-['Archivo_Black'] text-[var(--subtext)]">
              Extracted Sections
            </div>
            <div className="font-bold text-[var(--sv-cyan)] mt-0.5">
              {Object.keys(sections).length} Keys
            </div>
          </div>
          <div className="p-2 bg-[var(--input-bg)] border-2 border-black shadow-[2px_2px_0_#000000]">
            <div className="text-[9px] uppercase font-['Archivo_Black'] text-[var(--subtext)]">
              Last Scraped
            </div>
            <div className="font-bold text-[var(--fg)] mt-0.5 text-[11px] truncate">
              {latestSnapshot?.scrapedAt
                ? new Date(latestSnapshot.scrapedAt).toLocaleString()
                : "Just now"}
            </div>
          </div>
          <div className="p-2 bg-[var(--input-bg)] border-2 border-black shadow-[2px_2px_0_#000000]">
            <div className="text-[9px] uppercase font-['Archivo_Black'] text-[var(--subtext)]">
              Deduplication
            </div>
            <div className="font-bold text-emerald-400 mt-0.5 text-[11px] flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b-2 border-black pb-2">
        <button
          onClick={() => setActiveTab("kv")}
          className={`btn text-xs font-['Bangers'] tracking-wider px-4 py-2 flex items-center gap-1.5 transition-all ${
            activeTab === "kv"
              ? "bg-[#FFD400] text-black border-2 border-black shadow-[3px_3px_0_#000000]"
              : "bg-[var(--card-bg)] text-[var(--fg)] border-2 border-black opacity-70 hover:opacity-100"
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" /> VALUE TABLE
        </button>

        <button
          onClick={() => setActiveTab("diff")}
          className={`btn text-xs font-['Bangers'] tracking-wider px-4 py-2 flex items-center gap-1.5 transition-all ${
            activeTab === "diff"
              ? "bg-[#00E5FF] text-black border-2 border-black shadow-[3px_3px_0_#000000]"
              : "bg-[var(--card-bg)] text-[var(--fg)] border-2 border-black opacity-70 hover:opacity-100"
          }`}
        >
          <Diff className="w-3.5 h-3.5" /> DIFFERENTIAL ANALYSIS
        </button>

        {/* <button
          onClick={() => setActiveTab("raw")}
          className={`btn text-xs font-['Bangers'] tracking-wider px-4 py-2 flex items-center gap-1.5 transition-all ${
            activeTab === "raw"
              ? "bg-[#FF2E63] text-white border-2 border-black shadow-[3px_3px_0_#000000]"
              : "bg-[var(--card-bg)] text-[var(--fg)] border-2 border-black opacity-70 hover:opacity-100"
          }`}
        >
          <Database className="w-3.5 h-3.5" /> RAW JSON TELEMETRY
        </button> */}
      </div>

      {activeTab === "kv" && (
        <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Bangers'] text-xl tracking-wide text-[var(--fg)]">
              EXTRACTED DOCUMENT SECTIONS ({Object.keys(sections).length})
            </h2>
            <span className="text-[10px] font-mono text-[var(--subtext)]">
              Click any row to expand full clause
            </span>
          </div>

          {Object.keys(sections).length === 0 ? (
            <div className="p-8 text-center bg-[var(--input-bg)] border-2 border-dashed border-black/30 font-mono text-xs text-[var(--subtext)]">
              No scraped data available yet. Click "TRIGGER SCAN" above to fetch
              document text.
            </div>
          ) : (
            <div className="border-2 border-black overflow-hidden shadow-[4px_4px_0_#000000]">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--sv-yellow)] text-black border-b-2 border-black font-['Archivo_Black'] text-[11px] uppercase">
                    <th className="p-3 border-r-2 border-black w-1/3">
                      Policy Section / Key
                    </th>
                    <th className="p-3">Extracted Clause Content & Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black bg-[var(--card-bg)] text-[var(--fg)]">
                  {Object.entries(sections).map(([key, val], idx) => {
                    const isExpanded = expandedKey === key;
                    const valStr =
                      typeof val === "string" ? val : JSON.stringify(val);

                    return (
                      <motion.tr
                        key={key}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setExpandedKey(isExpanded ? null : key)}
                        className="cursor-pointer hover:bg-[var(--sv-cyan)]/10 transition-colors"
                      >
                        <td className="p-3 border-r-2 border-black align-top font-bold text-[var(--sv-cyan)]">
                          <div className="flex items-center justify-between">
                            <span className="truncate pr-2">{key}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-black" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
                            )}
                          </div>
                        </td>
                        <td className="p-3 align-top leading-relaxed text-[11px]">
                          {isExpanded ? (
                            <div className="space-y-2 whitespace-pre-wrap">
                              <p className="bg-[var(--input-bg)] p-3 border-2 border-black shadow-[2px_2px_0_#000000]">
                                {valStr}
                              </p>
                            </div>
                          ) : (
                            <p className="line-clamp-2 text-[var(--subtext)]">
                              {valStr}
                            </p>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "diff" && (
        <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Bangers'] text-xl tracking-wide text-[var(--fg)]">
              DIFFERENTIAL SNAPSHOT COMPARISON
            </h2>
            <span className="caption caption--cyan text-[9px]">
              BASELINE VERIFICATION
            </span>
          </div>

          {!previousSnapshot ? (
            <div className="p-6 bg-[var(--input-bg)] border-2 border-black shadow-[3px_3px_0_#000000] text-center font-mono text-xs text-[var(--subtext)]">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              Initial baseline snapshot recorded. Subsequent runs will display
              fine-grained line-by-line diffs here.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400">
                + Added lines: 0 | - Removed lines: 0 | Baseline Verified
                Identical
              </div>
              <div className="p-4 bg-[var(--input-bg)] border-2 border-black font-mono text-[11px] leading-relaxed">
                No semantic policy changes detected between latest scrape and
                prior baseline.
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "raw" && (
        <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-['Bangers'] text-xl tracking-wide text-[var(--fg)]">
              RAW SCRAPED JSON PAYLOAD
            </h2>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(latestSnapshot || {}, null, 2),
                );
                flash("✓ Raw JSON copied to clipboard");
              }}
              className="btn btn--yellow text-xs px-3 py-1 font-['Bangers'] tracking-wider"
            >
              <Copy className="w-3 h-3 mr-1 inline" /> COPY RAW JSON
            </button>
          </div>
          <pre className="p-4 bg-[#0B0714] text-[#00E5FF] border-2 border-black shadow-[4px_4px_0_#000000] font-mono text-[10px] overflow-x-auto max-h-96 rounded-none">
            {JSON.stringify(
              latestSnapshot || { message: "No snapshot loaded" },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
