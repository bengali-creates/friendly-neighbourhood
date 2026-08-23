"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCollectors,
  useRunAgent,
  useHealAgent,
  useDeleteCollector,
  useWatchUrl,
} from "@/lib/queries";
import { useRadarStore } from "@/lib/radarStore";
import { useAgentStore } from "@/lib/agentStore";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Play,
  Zap,
  Trash2,
  Globe,
  Shield,
  AlertTriangle,
  FileText,
  RefreshCw,
  Plus,
  Clock,
  Wifi,
  Code2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Eye,
} from "lucide-react";

const SOURCE_ICON: Record<string, any> = {
  tos: FileText,
  recall: AlertTriangle,
  civic: Shield,
  search: Globe,
};

const SOURCE_LABEL: Record<string, string> = {
  tos: "Terms of Service",
  recall: "Product Recall",
  civic: "Civic / Gov",
  search: "General Search",
};

const HEAL_TYPE_ICON: Record<string, any> = {
  network: Wifi,
  extraction: Code2,
  diff: RefreshCw,
};

type Collector = {
  id: number;
  collectorId: string;
  name: string;
  url: string;
  sourceType: string;
  createdAt: string;
  healCount: number;
  lastHealedAt: string | null;
  lastHealType: string | null;
};

function CollectorCard({
  c,
  onRun,
  onHeal,
  onDelete,
  isRunning,
  isHealing,
  isDeleting,
}: {
  c: Collector;
  onRun: () => void;
  onHeal: () => void;
  onDelete: () => void;
  isRunning: boolean;
  isHealing: boolean;
  isDeleting: boolean;
}) {
  const Icon = SOURCE_ICON[c.sourceType] ?? Globe;
  const HealIcon = c.lastHealType
    ? (HEAL_TYPE_ICON[c.lastHealType] ?? Wifi)
    : null;
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(c.collectorId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="comic-panel bg-[var(--card-bg)] border-2 border-black shadow-[4px_4px_0_#000000] p-4 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <Link
          href={`/scrapers/${c.collectorId}`}
          className="shrink-0 hover:scale-105 transition-transform"
        >
          <div className="w-9 h-9 bg-[var(--sv-cyan)]/15 border-2 border-black flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--sv-cyan)]" />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/scrapers/${c.collectorId}`} className="group">
              <p className="text-sm font-bold text-[var(--fg)] group-hover:text-[var(--sv-magenta)] font-['Bangers'] tracking-wide truncate transition-colors">
                {c.name}
              </p>
            </Link>
            <span className="caption text-[9px] bg-[var(--sv-cyan)]/10 text-[var(--sv-cyan)] px-1.5 py-0.5 border border-[var(--sv-cyan)]/30">
              {SOURCE_LABEL[c.sourceType] ?? c.sourceType}
            </span>
            {c.healCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-[#FFD400]">
                {HealIcon && <HealIcon className="w-2.5 h-2.5" />}
                {c.healCount} heal{c.healCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <button
            onClick={copyId}
            className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-[var(--subtext)] hover:text-[var(--sv-cyan)] transition-colors"
            title="Copy collector ID"
          >
            <Copy className="w-2.5 h-2.5" />
            {copied ? "Copied!" : c.collectorId}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-[var(--input-bg)] border border-black px-2 py-1.5">
        <Globe className="w-3 h-3 text-[var(--subtext)] shrink-0" />
        <span className="text-[10px] font-mono text-[var(--sv-cyan)] truncate flex-1">
          {c.url}
        </span>
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <ExternalLink className="w-3 h-3 text-[var(--subtext)] hover:text-[var(--fg)]" />
        </a>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-[var(--subtext)]">
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Added {new Date(c.createdAt).toLocaleDateString()}
        </span>
        {c.lastHealedAt && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            Last healed {new Date(c.lastHealedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-black/20 flex-wrap">
        <Link href={`/scrapers/${c.collectorId}`} className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full font-['Bangers'] text-xs tracking-wider border-2 border-black bg-[var(--input-bg)] hover:bg-[var(--sv-cyan)] hover:text-black shadow-[2px_2px_0_#000000] active:scale-[0.98] transition-all"
          >
            <Eye className="w-3 h-3 mr-1" />
            VIEW DATA
          </Button>
        </Link>
        <Button
          variant="yellow"
          size="sm"
          onClick={onRun}
          disabled={isRunning}
          className="flex-1 font-['Bangers'] text-xs tracking-wider"
        >
          <Play className="w-3 h-3 mr-1" />
          {isRunning ? "SCANNING…" : "SCAN NOW"}
        </Button>
        <Button
          variant="cyan"
          size="sm"
          onClick={onHeal}
          disabled={isHealing}
          className="flex-1 font-['Bangers'] text-xs tracking-wider"
          title="Trigger Bright Data self-heal for this collector"
        >
          <Zap className="w-3 h-3 mr-1" />
          {isHealing ? "HEALING…" : "BD HEAL"}
        </Button>
        <Button
          variant="magenta"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="font-['Bangers'] text-xs tracking-wider px-2"
          title="Remove from registry"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function ServicesPage() {
  const qc = useQueryClient();
  const { flash } = useRadarStore();
  const { setAgentStatus } = useAgentStore();

  const { data, isLoading } = useCollectors();
  const collectors: Collector[] = data?.data ?? [];

  const runAgent = useRunAgent();
  const healAgent = useHealAgent();
  const deleteCollector = useDeleteCollector();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [healingId, setHealingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

   
  const total = collectors.length;
  const healed = collectors.filter((c) => c.healCount > 0).length;
  const totalHeals = collectors.reduce((s, c) => s + (c.healCount ?? 0), 0);

  const handleRun = async (c: Collector) => {
    setActiveId(c.collectorId);
    setAgentStatus("running");
    flash(`Scanning ${c.name}…`);
    try {
      await runAgent.mutateAsync({
        collector_id: c.collectorId,
        url: c.url,
        source_type: c.sourceType,
      });
      flash(`✓ ${c.name} scan complete`);
      setAgentStatus("idle");
    } catch {
      flash(`✗ Error scanning ${c.name}`);
      setAgentStatus("error");
    } finally {
      setActiveId(null);
      qc.invalidateQueries({ queryKey: ["alerts"] });
    }
  };

  const handleHeal = async (c: Collector) => {
    setHealingId(c.collectorId);
    flash(`⚡ Triggering Bright Data heal for ${c.name}…`);
    try {
      await healAgent.mutateAsync({
        collector_id: c.collectorId,
        url: c.url,
        issue_description:
          "Manual heal triggered from dashboard — re-analyse selectors",
      });
      flash(`✓ Bright Data heal dispatched for ${c.name}`);
    } catch {
      flash(`✗ Heal failed for ${c.name}`);
    } finally {
      setHealingId(null);
    }
  };

  const handleDelete = async (c: Collector) => {
    if (
      !confirm(
        `Remove "${c.name}" from the registry? The Bright Data collector will remain, but it won't be re-used automatically.`,
      )
    )
      return;
    setDeletingId(c.collectorId);
    try {
      await deleteCollector.mutateAsync(c.collectorId);
      flash(`✓ ${c.name} removed from registry`);
    } catch {
      flash(`✗ Could not remove ${c.name}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="caption caption--cyan text-[10px] mb-1">
            BRIGHT DATA SCRAPER REGISTRY
          </span>
          <h1 className="font-['Bangers'] text-3xl tracking-wide text-[var(--fg)]">
            COLLECTOR MANAGEMENT
          </h1>
          <p className="text-[11px] text-[var(--subtext)] font-sans mt-1">
            One collector per URL — deduplicated automatically. Scan, heal, or
            remove collectors from the registry.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col items-center comic-panel bg-[var(--input-bg)] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0_#000000]">
            <span className="font-['Bangers'] text-2xl text-[var(--sv-cyan)]">
              {total}
            </span>
            <span className="text-[9px] font-mono text-[var(--subtext)] uppercase">
              Collectors
            </span>
          </div>
          <div className="flex flex-col items-center comic-panel bg-[var(--input-bg)] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0_#000000]">
            <span className="font-['Bangers'] text-2xl text-[#FFD400]">
              {totalHeals}
            </span>
            <span className="text-[9px] font-mono text-[var(--subtext)] uppercase">
              Total Heals
            </span>
          </div>
          <div className="flex flex-col items-center comic-panel bg-[var(--input-bg)] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0_#000000]">
            <span className="font-['Bangers'] text-2xl text-emerald-400">
              {healed}
            </span>
            <span className="text-[9px] font-mono text-[var(--subtext)] uppercase">
              Ever Healed
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-[var(--card-bg)] border-2 border-[var(--sv-cyan)] shadow-[3px_3px_0_var(--sv-cyan)] p-3">
        <CheckCircle2 className="w-4 h-4 text-[var(--sv-cyan)] shrink-0 mt-0.5" />
        <p className="text-[10px] font-mono text-[var(--subtext)] leading-relaxed">
          <span className="text-[var(--sv-cyan)] font-bold">
            URL DEDUPLICATION ACTIVE:{" "}
          </span>
          When a URL is submitted that already has a collector, the existing
          Bright Data collector is reused — no duplicate scrapers are created.
          The collector ID (<code className="text-[var(--fg)]">c_xxxx</code>) is
          the Bright Data Scraper Studio reference.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-48 border-2 border-black" />
          ))}
        </div>
      )}

      {!isLoading && collectors.length === 0 && (
        <div className="comic-panel bg-[var(--input-bg)] border-2 border-dashed border-[#FFD400]/50 p-10 text-center">
          <Plus className="w-8 h-8 text-[var(--subtext)] mx-auto mb-3" />
          <p className="font-['Bangers'] text-xl text-[var(--fg)] mb-1">
            NO COLLECTORS YET
          </p>
          <p className="text-[11px] font-mono text-[var(--subtext)]">
            Add a URL from the dashboard to create your first Bright Data
            collector.
          </p>
        </div>
      )}

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collectors.map((c) => (
            <CollectorCard
              key={c.collectorId}
              c={c}
              onRun={() => handleRun(c)}
              onHeal={() => handleHeal(c)}
              onDelete={() => handleDelete(c)}
              isRunning={activeId === c.collectorId}
              isHealing={healingId === c.collectorId}
              isDeleting={deletingId === c.collectorId}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
