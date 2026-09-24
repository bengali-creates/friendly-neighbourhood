import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { Shield, Radio, Activity, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AlertsPanel() {
  const { data, isLoading, refetch, isRefetching } = useAlerts();
  const { openAlert } = useStore();
  const alerts = data?.data ?? [];

  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const filteredAlerts = alerts.filter((item: any) => {
    return (
      activeFilter === "ALL" || item.severity?.toUpperCase() === activeFilter
    );
  });

  const getSeverityBadgeVariant = (sev: string): "critical" | "warning" | "info" => {
    const s = sev?.toUpperCase();
    if (s === "CRITICAL" || s === "DANGER") return "critical";
    if (s === "WARNING") return "warning";
    return "info";
  };

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--depth)] border border-[var(--rim)] p-5 flex flex-col gap-4 relative overflow-hidden transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--rim)] pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--alert)] shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--ink-secondary)] flex items-center">
              <Radio className="w-3 h-3 mr-1 text-[var(--watchful)] animate-pulse" /> Radar Feed Active
            </span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--ink-primary)] mt-1">
            Autonomous Radar & Alerts
          </h2>
        </div>

        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="secondary"
          size="sm"
          className="text-xs self-start sm:self-auto shrink-0 gap-1.5"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
          />
          {isRefetching ? "Sweeping Grid..." : "Trigger Sweep"}
        </Button>
      </div>

      <div className="relative border border-[var(--rim)] bg-[var(--surface)] p-2.5 rounded-[var(--radius-md)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 w-full md:w-auto px-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--clear)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--clear)]"></span>
          </span>
          <span className="text-xs font-medium text-[var(--ink-primary)]">
            Sensor Grid:{" "}
            <span className="text-[var(--clear)] font-mono text-[11px]">
              Nominal
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["ALL", "CRITICAL", "WARNING", "INFO"].map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius-sm)] border transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-[var(--depth)] text-[var(--ink-primary)] border-[var(--rim)] shadow-sm"
                    : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--depth)]/50"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && <ScannerSkeletonRows />}

      {!isLoading && filteredAlerts.length === 0 && (
        <SpiderWebRadarScanner filter={activeFilter} />
      )}

      {!isLoading && filteredAlerts.length > 0 && (
        <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence>
            {filteredAlerts.map((alert: any, i: number) => {
              const sevBadge = getSeverityBadgeVariant(alert.severity);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => openAlert(alert)}
                  className="group relative border border-[var(--rim)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] hover:border-[rgba(196,181,253,0.3)] p-4 transition-all cursor-pointer rounded-[var(--radius-md)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={sevBadge} className="text-[10px]">
                        {alert.severity}
                      </Badge>
                      {alert.category && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-tertiary)] px-1.5 py-0.5 rounded bg-[var(--depth)] border border-[var(--rim)]">
                          {alert.category}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-[var(--ink-tertiary)]">
                      {new Date(alert.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-[var(--ink-primary)] leading-relaxed group-hover:text-[var(--watchful)] transition-colors mb-3">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--rim)]/40 text-[10px] font-mono text-[var(--ink-tertiary)]">
                    <span className="truncate max-w-[200px]">
                      Node: {alert.collectorId || "c_active"}
                    </span>

                    <span className="flex items-center text-[10px] font-medium text-[var(--watchful)] group-hover:translate-x-0.5 transition-transform">
                      Inspect Details{" "}
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/**
 * Large Comical Spider-Web Radar Scanner Display
 */
function SpiderWebRadarScanner({ filter }: { filter: string }) {
  return (
    <div className="relative border border-[var(--rim)] bg-[var(--surface)]/30 p-8 text-center overflow-hidden rounded-[var(--radius-md)] flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(196,181,253,0.05)_0,transparent_75%)] pointer-events-none" />

      <div className="flex items-center justify-between w-full mb-3 z-10">
        <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-[var(--ink-tertiary)]">
          RADAR SENSOR 10.4 GHz
        </span>
        <span className="text-[10px] font-mono text-[var(--clear)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--clear)] animate-pulse" />
          ALL SYSTEMS NOMINAL
        </span>
      </div>

      <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-4 flex items-center justify-center">
        {/* Subtle radar rings */}
        <div className="absolute inset-0 rounded-full border border-[var(--rim)]" />
        <div className="absolute inset-8 rounded-full border border-[var(--rim)]/70" />
        <div className="absolute inset-16 rounded-full border border-[var(--rim)]/50" />
        <div className="absolute inset-24 rounded-full border border-[var(--rim)]/30" />

        {/* Sweep gradient */}
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(196,181,253,0.22)_360deg)] rounded-full animate-[spin_4s_linear_infinite] pointer-events-none" />

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full relative z-10"
        >
          {/* Crosshairs */}
          <line
            x1="100"
            y1="5"
            x2="100"
            y2="195"
            stroke="var(--rim)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <line
            x1="5"
            y1="100"
            x2="195"
            y2="100"
            stroke="var(--rim)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Node pings */}
          <circle
            cx="145"
            cy="65"
            r="3"
            fill="var(--watchful)"
            className="animate-pulse"
          />
          <circle
            cx="60"
            cy="135"
            r="3"
            fill="var(--clear)"
            className="animate-ping"
          />
          <circle
            cx="130"
            cy="150"
            r="2.5"
            fill="var(--ink-secondary)"
          />

          {/* Center core */}
          <circle
            cx="100"
            cy="100"
            r="5"
            fill="var(--depth)"
            stroke="var(--watchful)"
            strokeWidth="1.5"
          />
          <circle
            cx="100"
            cy="100"
            r="2"
            fill="var(--watchful)"
          />
        </svg>
      </div>

      <div className="mt-2 z-10">
        <h4 className="text-sm font-semibold tracking-tight text-[var(--ink-primary)] mb-1">
          Radar Sweep Complete • Grid Secure
        </h4>
        <p className="text-xs text-[var(--ink-secondary)] max-w-sm mx-auto leading-relaxed">
          {filter !== "ALL"
            ? `No active policy diffs or hazards matching filter "${filter}".`
            : "No active legal policy diffs or product recall hazards detected across monitored targets."}
        </p>
      </div>
    </div>
  );
}

function ScannerSkeletonRows() {
  return (
    <div className="flex flex-col gap-2.5 py-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden border border-[var(--rim)] bg-[var(--surface)]/50 p-4 rounded-[var(--radius-md)] h-20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(196,181,253,0.06)] to-transparent animate-[shimmer_1.5s_infinite]" />
          <div className="h-3.5 w-24 bg-[var(--rim)] rounded mb-2.5" />
          <div className="h-3 w-3/4 bg-[var(--rim)]/60 rounded" />
        </div>
      ))}
    </div>
  );
}
