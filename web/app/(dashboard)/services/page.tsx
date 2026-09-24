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
      className="bg-[var(--card)] border border-[var(--rim)] rounded-[var(--radius-md)] p-4 flex flex-col gap-3 shadow-[var(--shadow)]"
    >
      <div className="flex items-start gap-3">
        <Link
          href={`/scrapers/${c.collectorId}`}
          className="shrink-0 hover:scale-105 transition-transform"
        >
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--watchful-fill)] border border-[rgba(196,181,253,0.3)] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--watchful)]" />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/scrapers/${c.collectorId}`} className="group">
              <p className="text-sm font-semibold text-[var(--ink-primary)] group-hover:text-[var(--watchful)] tracking-tight truncate transition-colors">
                {c.name}
              </p>
            </Link>
            <span className="caption text-[9px] bg-[var(--surface)] text-[var(--ink-secondary)] px-1.5 py-0.5 border border-[var(--rim)] rounded">
              {SOURCE_LABEL[c.sourceType] ?? c.sourceType}
            </span>
            {c.healCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-[var(--clear)]">
                {HealIcon && <HealIcon className="w-2.5 h-2.5" />}
                {c.healCount} heal{c.healCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <button
            onClick={copyId}
            className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-[var(--ink-tertiary)] hover:text-[var(--watchful)] transition-colors cursor-pointer"
            title="Copy collector ID"
          >
            <Copy className="w-2.5 h-2.5" />
            {copied ? "Copied!" : c.collectorId}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--rim)] rounded-[var(--radius-sm)] px-2.5 py-1.5">
        <Globe className="w-3 h-3 text-[var(--ink-tertiary)] shrink-0" />
        <span className="text-[10px] font-mono text-[var(--watchful)] truncate flex-1">
          {c.url}
        </span>
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <ExternalLink className="w-3 h-3 text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)]" />
        </a>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-[var(--ink-tertiary)]">
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Added {new Date(c.createdAt).toLocaleDateString()}
        </span>
        {c.lastHealedAt && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-[var(--clear)]" />
            Last healed {new Date(c.lastHealedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-[var(--rim)]/40 flex-wrap">
        <Link href={`/scrapers/${c.collectorId}`} className="flex-1">
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            View Data
          </Button>
        </Link>
        <Button
          variant="default"
          size="sm"
          onClick={onRun}
          disabled={isRunning}
          className="flex-1 text-xs font-semibold"
        >
          <Play className="w-3 h-3 mr-1" />
          {isRunning ? "Scanning…" : "Scan Now"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onHeal}
          disabled={isHealing}
          className="flex-1 text-xs"
          title="Trigger Bright Data self-heal for this collector"
        >
          <Zap className="w-3 h-3 mr-1" />
          {isHealing ? "Healing…" : "BD Heal"}
        </Button>
        <Button
          variant="magenta"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="text-xs px-2"
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
      <div className="rounded-[var(--radius-lg)] bg-[var(--depth)] border border-[var(--rim)] p-5 md:p-6 flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--watchful)] mb-1 block">
            BRIGHT DATA SCRAPER REGISTRY
          </span>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
            Collector Management
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5 max-w-xl">
            One collector per URL — deduplicated automatically. Scan, heal, or
            remove collectors from the registry.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex flex-col items-center bg-[var(--surface)] border border-[var(--rim)] rounded-[var(--radius-md)] px-3.5 py-1.5">
            <span className="text-xl font-semibold text-[var(--ink-primary)]">
              {total}
            </span>
            <span className="text-[9px] font-mono text-[var(--ink-tertiary)] uppercase">
              Collectors
            </span>
          </div>
          <div className="flex flex-col items-center bg-[var(--surface)] border border-[var(--rim)] rounded-[var(--radius-md)] px-3.5 py-1.5">
            <span className="text-xl font-semibold text-[var(--clear)]">
              {totalHeals}
            </span>
            <span className="text-[9px] font-mono text-[var(--ink-tertiary)] uppercase">
              Total Heals
            </span>
          </div>
          <div className="flex flex-col items-center bg-[var(--surface)] border border-[var(--rim)] rounded-[var(--radius-md)] px-3.5 py-1.5">
            <span className="text-xl font-semibold text-[var(--watchful)]">
              {healed}
            </span>
            <span className="text-[9px] font-mono text-[var(--ink-tertiary)] uppercase">
              Ever Healed
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-[var(--surface)]/40 border border-[var(--rim)] rounded-[var(--radius-md)] p-3.5">
        <CheckCircle2 className="w-4 h-4 text-[var(--clear)] shrink-0 mt-0.5" />
        <p className="text-[10px] font-mono text-[var(--ink-secondary)] leading-relaxed">
          <span className="text-[var(--clear)] font-bold">
            URL DEDUPLICATION ACTIVE:{" "}
          </span>
          When a URL is submitted that already has a collector, the existing
          Bright Data collector is reused — no duplicate scrapers are created.
          The collector ID (<code className="text-[var(--ink-primary)]">c_xxxx</code>) is
          the Bright Data Scraper Studio reference.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-48 border border-[var(--rim)] rounded-[var(--radius-md)]" />
          ))}
        </div>
      )}

      {!isLoading && collectors.length === 0 && (
        <div className="rounded-[var(--radius-md)] bg-[var(--surface)]/30 border border-dashed border-[var(--rim)] p-10 text-center">
          <Plus className="w-8 h-8 text-[var(--ink-tertiary)] mx-auto mb-2" />
          <p className="text-sm font-semibold tracking-tight text-[var(--ink-primary)] mb-1">
            No Collectors Yet
          </p>
          <p className="text-xs text-[var(--ink-secondary)]">
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
