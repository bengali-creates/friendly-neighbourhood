"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Wifi,
  Code2,
  GitCompare,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HealEvent = {
  id: number;
  collectorId: string;
  collectorName: string | null;
  collectorUrl: string | null;
  sourceType: string | null;
  description: string;
  healType: string;
  resolution: string | null;
  attempts: number;
  durationMs: number | null;
  succeeded: boolean;
  healedAt: string;
};

const HEAL_TYPE_META: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; badge: string }
> = {
  network: {
    icon: <Wifi className="w-4 h-4" />,
    label: "Network / Bright Data",
    color: "text-[var(--sv-cyan)]",
    badge: "badge--info",
  },
  extraction: {
    icon: <Code2 className="w-4 h-4" />,
    label: "Extraction / LLM",
    color: "text-[#FFD400]",
    badge: "badge--warning",
  },
  diff: {
    icon: <GitCompare className="w-4 h-4" />,
    label: "Diff / Comparison",
    color: "text-emerald-400",
    badge: "badge--info",
  },
};

function HealTypePill({ type }: { type: string }) {
  const meta = HEAL_TYPE_META[type] ?? HEAL_TYPE_META.extraction;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${meta.color}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function StatCard({
  value,
  label,
  sub,
  icon,
}: {
  value: string | number;
  label: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--depth)] border border-[var(--rim)] p-4 flex flex-col gap-1 transition-colors">
      <div className="flex items-center gap-2 text-[var(--ink-secondary)] text-[10px] uppercase tracking-wider font-medium">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-[var(--ink-tertiary)] font-mono">{sub}</div>
      )}
    </div>
  );
}

export default function HealsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["heals"],
    queryFn: () => fetch("/api/heals").then((r) => r.json()),
    refetchInterval: 15_000,
  });

  const simulate = useMutation({
    mutationFn: (count: number) =>
      fetch("/api/heals/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["heals"] }),
  });

  const heals: HealEvent[] = data?.data ?? [];

  const totalHeals = heals.length;
  const succeeded = heals.filter((h) => h.succeeded).length;
  const networkHeals = heals.filter((h) => h.healType === "network").length;
  const avgDuration =
    heals.length > 0
      ? Math.round(
          (heals
            .filter((h) => h.durationMs)
            .reduce((s, h) => s + (h.durationMs ?? 0), 0) /
            (heals.filter((h) => h.durationMs).length || 1) /
            1000) *
            10,
        ) / 10
      : 0;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="rounded-[var(--radius-lg)] bg-[var(--depth)] border border-[var(--rim)] p-5 md:p-6 flex items-center justify-between flex-wrap gap-4 transition-colors">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--watchful)] mb-1 block">
            BRIGHT DATA INTEGRATION
          </span>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">
            Self-Healing Telemetry
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5 max-w-xl">
            Real-time log of network blocks, CAPTCHA bypasses, and extraction
            failures auto-repaired by Bright Data + the Spider-Sense agent.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => qc.invalidateQueries({ queryKey: ["heals"] })}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs font-semibold"
            onClick={() => simulate.mutate(4)}
            disabled={simulate.isPending}
          >
            <Zap className="w-3 h-3 mr-1" />
            {simulate.isPending ? "Injecting..." : "Simulate Heals"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          value={totalHeals}
          label="TOTAL HEAL EVENTS"
          sub="all time"
          icon={<ShieldCheck className="w-3.5 h-3.5 text-[var(--watchful)]" />}
        />
        <StatCard
          value={`${totalHeals ? Math.round((succeeded / totalHeals) * 100) : 100}%`}
          label="HEAL SUCCESS RATE"
          sub={`${succeeded}/${totalHeals} succeeded`}
          icon={<Activity className="w-3.5 h-3.5 text-[var(--clear)]" />}
        />
        <StatCard
          value={networkHeals}
          label="NETWORK UNBLOCKS"
          sub="via Bright Data proxy"
          icon={<Wifi className="w-3.5 h-3.5 text-[var(--watchful)]" />}
        />
        <StatCard
          value={avgDuration ? `${avgDuration}s` : "—"}
          label="AVG REPAIR TIME"
          sub="detect to fix"
          icon={<Clock className="w-3.5 h-3.5 text-[var(--ink-secondary)]" />}
        />
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--depth)] border border-[var(--rim)] p-5 flex flex-col gap-4 transition-colors">
        <div className="flex items-center justify-between border-b border-[var(--rim)] pb-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--ink-primary)]">
              Heal Event Log
            </h2>
            <p className="text-[10px] text-[var(--ink-tertiary)] font-mono mt-0.5">
              Network heals = Bright Data intervened · Extraction heals = LLM /
              selector repair · Diff heals = comparison engine fixed
            </p>
          </div>
          <span className="text-[10px] font-mono text-[var(--clear)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--clear)] animate-pulse" />
            LIVE
          </span>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="skeleton h-20 border border-[var(--rim)] rounded-[var(--radius-md)]"
              />
            ))}
          </div>
        )}

        {!isLoading && heals.length === 0 && (
          <div className="rounded-[var(--radius-md)] bg-[var(--surface)]/30 border border-dashed border-[var(--clear)]/40 p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-[var(--clear)] mx-auto mb-2" />
            <p className="text-sm font-semibold tracking-tight text-[var(--ink-primary)] mb-1">
              All Scrapers Healthy
            </p>
            <p className="text-xs text-[var(--ink-secondary)]">
              No heal events recorded. Click "Simulate Heals" to inject test
              events.
            </p>
          </div>
        )}

        <AnimatePresence>
          {heals.map((heal, i) => {
            const meta =
              HEAL_TYPE_META[heal.healType] ?? HEAL_TYPE_META.extraction;
            return (
              <motion.div
                key={heal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className="bg-[var(--surface)]/50 border border-[var(--rim)] p-4 rounded-[var(--radius-md)] flex flex-col gap-2.5 hover:border-[rgba(196,181,253,0.3)] transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <HealTypePill type={heal.healType} />
                      <span
                        className={`badge text-[9px] font-mono tracking-wider ${meta.badge}`}
                      >
                        {heal.healType.toUpperCase()}
                      </span>
                      {heal.succeeded ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--clear)]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-[var(--alert)]" />
                      )}
                      {heal.attempts > 1 && (
                        <span className="text-[9px] font-mono text-[var(--ink-tertiary)]">
                          {heal.attempts} attempts
                        </span>
                      )}
                      {heal.durationMs && (
                        <span className="text-[9px] font-mono text-[var(--ink-tertiary)] flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {(heal.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[var(--ink-primary)] leading-snug mt-1">
                      {heal.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-medium text-[var(--ink-secondary)]">
                      {heal.collectorName ?? heal.collectorId}
                    </p>
                    {heal.collectorUrl && (
                      <p className="text-[9px] text-[var(--ink-tertiary)] font-mono truncate max-w-[180px]">
                        {
                          heal.collectorUrl
                            .replace(/^https?:\/\//, "")
                            .split("/")[0]
                        }
                      </p>
                    )}
                    <p className="text-[9px] text-[var(--ink-tertiary)] font-mono mt-0.5">
                      {new Date(heal.healedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {heal.resolution && (
                  <div className="border-t border-[var(--rim)]/40 pt-2">
                    <p className="text-[10px] font-mono text-[var(--ink-secondary)] leading-relaxed">
                      <span className="text-[var(--clear)] font-bold">
                        RESOLUTION →{" "}
                      </span>
                      {heal.resolution}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="rounded-[var(--radius-md)] bg-[var(--surface)]/50 border border-[var(--rim)] p-4 flex items-start gap-3 transition-colors">
        <ShieldCheck className="w-5 h-5 text-[var(--watchful)] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-[var(--ink-primary)]">
            Powered by Bright Data Autonomous Infrastructure
          </p>
          <p className="text-[10px] text-[var(--ink-secondary)] font-mono mt-0.5 leading-relaxed">
            Network-level heals (proxy rotation, CAPTCHA solving, bot-bypass)
            are handled automatically by Bright Data's scraping infrastructure.
            Application-level heals (LLM retries, selector repair, diff
            fallbacks) are managed by the Spider-Sense agent graph. Together
            they ensure 24/7 monitoring reliability without manual intervention.
          </p>
        </div>
      </div>
    </div>
  );
}
