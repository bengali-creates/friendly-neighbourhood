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
    <div className="comic-panel bg-[var(--card-bg)] border-2 border-black shadow-[4px_4px_0_#000000] p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[var(--subtext)] text-[10px] uppercase tracking-wider font-bold">
        {icon}
        {label}
      </div>
      <div className="font-['Bangers'] text-3xl tracking-wider text-[var(--fg)]">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-[var(--subtext)] font-mono">{sub}</div>
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
      <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="caption caption--cyan text-[10px] mb-1">
            BRIGHT DATA INTEGRATION
          </span>
          <h1 className="font-['Bangers'] text-3xl tracking-wide text-[var(--fg)]">
            SELF-HEALING TELEMETRY
          </h1>
          <p className="text-[11px] text-[var(--subtext)] font-sans mt-1">
            Real-time log of network blocks, CAPTCHA bypasses, and extraction
            failures auto-repaired by Bright Data + the Spider-Sense agent.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-bold border-2 border-black shadow-[2px_2px_0_#000000]"
            onClick={() => qc.invalidateQueries({ queryKey: ["heals"] })}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> REFRESH
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-bold border-2 border-[#FFD400] shadow-[2px_2px_0_#000000] text-[#FFD400] hover:bg-[#FFD400] hover:text-black transition-colors"
            onClick={() => simulate.mutate(4)}
            disabled={simulate.isPending}
          >
            <Zap className="w-3 h-3 mr-1" />
            {simulate.isPending ? "INJECTING..." : "SIMULATE HEALS"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          value={totalHeals}
          label="Total Heals"
          sub="all time"
          icon={<Activity className="w-3.5 h-3.5" />}
        />
        <StatCard
          value={`${succeeded}/${totalHeals}`}
          label="Succeeded"
          sub={
            totalHeals > 0
              ? `${Math.round((succeeded / totalHeals) * 100)}% success rate`
              : "—"
          }
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
        />
        <StatCard
          value={networkHeals}
          label="BD Network Heals"
          sub="proxy / CAPTCHA / block"
          icon={<Wifi className="w-3.5 h-3.5" />}
        />
        <StatCard
          value={`${avgDuration}s`}
          label="Avg Heal Time"
          sub="time to recovery"
          icon={<Clock className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <h2 className="font-['Bangers'] text-xl tracking-wide text-[var(--fg)]">
              HEAL EVENT LOG
            </h2>
            <p className="text-[10px] text-[var(--subtext)] font-mono">
              Network heals = Bright Data intervened · Extraction heals = LLM /
              selector repair · Diff heals = comparison engine fixed
            </p>
          </div>
          <span className="caption caption--red text-[9px]">LIVE</span>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="skeleton h-24 border-2 border-black rounded"
              />
            ))}
          </div>
        )}

        {!isLoading && heals.length === 0 && (
          <div className="comic-panel bg-[var(--input-bg)] border-2 border-dashed border-emerald-500/40 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-['Bangers'] text-xl tracking-wider text-[var(--fg)] mb-1">
              ALL SCRAPERS HEALTHY
            </p>
            <p className="text-[11px] text-[var(--subtext)] font-mono">
              No heal events recorded. Click "SIMULATE HEALS" to inject test
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
                className="bg-[var(--input-bg)] border-2 border-black p-4 shadow-[3px_3px_0_#000000] flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <HealTypePill type={heal.healType} />
                      <span
                        className={`badge text-[9px] font-['Bangers'] tracking-wider ${meta.badge}`}
                      >
                        {heal.healType.toUpperCase()}
                      </span>
                      {heal.succeeded ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-[#FF2E63]" />
                      )}
                      {heal.attempts > 1 && (
                        <span className="text-[9px] font-mono text-[var(--subtext)]">
                          {heal.attempts} attempts
                        </span>
                      )}
                      {heal.durationMs && (
                        <span className="text-[9px] font-mono text-[var(--subtext)] flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {(heal.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[var(--fg)] leading-snug mt-1">
                      {heal.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-[var(--subtext)]">
                      {heal.collectorName ?? heal.collectorId}
                    </p>
                    {heal.collectorUrl && (
                      <p className="text-[9px] text-[var(--subtext)] font-mono truncate max-w-[180px]">
                        {
                          heal.collectorUrl
                            .replace(/^https?:\/\//, "")
                            .split("/")[0]
                        }
                      </p>
                    )}
                    <p className="text-[9px] text-[var(--subtext)] font-mono mt-0.5">
                      {new Date(heal.healedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {heal.resolution && (
                  <div className="border-t border-black/20 pt-2">
                    <p className="text-[10px] font-mono text-[var(--subtext)] leading-relaxed">
                      <span className="text-emerald-400 font-bold">
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

      <div className="comic-panel bg-[var(--card-bg)] border-2 border-[var(--sv-cyan)] shadow-[4px_4px_0_var(--sv-cyan)] p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[var(--sv-cyan)] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-[var(--fg)]">
            Powered by Bright Data Autonomous Infrastructure
          </p>
          <p className="text-[10px] text-[var(--subtext)] font-mono mt-0.5">
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
