"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { Shield, Radio, Activity, RefreshCw, ChevronRight } from "lucide-react";

const SEV_CLASS: Record<string, string> = {
  CRITICAL: "badge--critical",
  WARNING: "badge--warning",
  INFO: "badge--info",
};

const CATEGORY_TAG: Record<string, { label: string; class: string }> = {
  tos: { label: "TOS DIFF", class: "caption--cyan" },
  recall: { label: "HAZARD RECALL", class: "caption--red" },
  civic: { label: "CIVIC NOTICE", class: "caption" },
  general: { label: "SECURITY RADAR", class: "caption--ghost" },
};

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

  return (
    <div className="comic-panel bg-[var(--card-bg)] border-3 border-[#111111] shadow-[6px_6px_0_var(--shadow-color)] p-5 flex flex-col gap-4 rounded-sm relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border-2 border-dashed border-[var(--sv-cyan)]/20 animate-[spin_25s_linear_infinite]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#111111] pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="caption caption--red">SPIDER SENSE</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--sv-cyan)] flex items-center">
              <Radio className="w-3 h-3 mr-1 animate-pulse" /> RADAR FEED ACTIVE
            </span>
          </div>
          <h2 className="font-['Bangers'] text-3xl tracking-wide text-[var(--fg)] mt-1">
            AUTONOMOUS RADAR & ALERTS
          </h2>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="btn btn--yellow text-xs font-['Bangers'] tracking-wider self-start sm:self-auto shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1 ${isRefetching ? "animate-spin" : ""}`}
          />
          {isRefetching ? "SCANNING GRID..." : "TRIGGER SWEEP"}
        </button>
      </div>

      <div className="relative border-2 border-[#111111] bg-[var(--input-bg)] p-3 shadow-[3px_3px_0_#111111] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-[#111111] animate-ping" />
          <span className="font-['Archivo_Black'] text-xs uppercase text-[var(--card-text)]">
            WEB SENSOR GRID:{" "}
            <span className="text-[var(--sv-cyan)] font-mono">
              ALL SYSTEMS NOMINAL
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["ALL", "CRITICAL", "WARNING", "INFO"].map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-[10px] font-['Archivo_Black'] uppercase px-2.5 py-1 border-2 border-[#111111] shadow-[2px_2px_0_#111111] transition-all whitespace-nowrap ${
                  active
                    ? "bg-[var(--sv-yellow)] text-black font-bold"
                    : "bg-[var(--card-bg)] text-[var(--card-text)] hover:bg-[var(--sv-cyan)]/20"
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
        <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence>
            {filteredAlerts.map((alert: any, i: number) => {
              const categoryTag =
                CATEGORY_TAG[alert.category || "general"] ||
                CATEGORY_TAG.general;
              const sevBadge = SEV_CLASS[alert.severity] || "badge--info";

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => openAlert(alert)}
                  className="group relative border-3 border-[#111111] bg-[var(--input-bg)] p-4 shadow-[4px_4px_0_#111111] hover:shadow-[6px_6px_0_#111111] hover:translate-y-[-2px] transition-all cursor-pointer rounded-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`badge ${sevBadge} font-['Bangers'] tracking-wider text-xs`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`caption ${categoryTag.class} text-[9px] px-2 py-0.5`}
                      >
                        {categoryTag.label}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-[var(--subtext)]">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[var(--fg)] leading-relaxed group-hover:text-[var(--sv-cyan)] transition-colors mb-3">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t-2 border-[#111111]/10 text-[10px] font-mono text-[var(--subtext)]">
                    <span className="truncate max-w-[200px]">
                      Collector: {alert.collectorId || "c_active"}
                    </span>

                    <span className="flex items-center font-['Archivo_Black'] uppercase text-[10px] text-[var(--sv-magenta)] group-hover:translate-x-1 transition-transform">
                      INSPECT POSITION A/B{" "}
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
    <div className="relative border-3 border-[#111111] bg-[var(--input-bg)] p-6 shadow-[6px_6px_0_#111111] text-center overflow-hidden rounded-sm flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.06)_0,transparent_75%)] pointer-events-none" />

      <div className="flex items-center justify-between w-full mb-3 z-10">
        <span className="caption caption--yellow text-[10px]">
          WEB RADAR 10.4 GHz
        </span>
        <span className="caption caption--cyan text-[10px]">
          ALL SENSORS NOMINAL
        </span>
      </div>

      <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--sv-magenta)]/30 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute inset-6 rounded-full border-2 border-cyan-500/20" />
        <div className="absolute inset-14 rounded-full border-2 border-yellow-500/20" />

        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_310deg,rgba(0,229,255,0.45)_360deg)] rounded-full animate-[spin_3s_linear_infinite] pointer-events-none" />

        <svg
          viewBox="0 0 300 300"
          className="w-full h-full relative z-10 drop-shadow-[2px_2px_0_#111111]"
        >
          <line
            x1="150"
            y1="10"
            x2="150"
            y2="290"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--card-text)] opacity-40"
          />
          <line
            x1="10"
            y1="150"
            x2="290"
            y2="150"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--card-text)] opacity-40"
          />
          <line
            x1="51"
            y1="51"
            x2="249"
            y2="249"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--card-text)] opacity-40"
          />
          <line
            x1="249"
            y1="51"
            x2="51"
            y2="249"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--card-text)] opacity-40"
          />

          <polygon
            points="150,20 241,58 280,150 241,241 150,280 58,241 20,150 58,58"
            fill="none"
            stroke="var(--sv-cyan)"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <polygon
            points="150,60 213,86 240,150 213,213 150,240 86,213 60,150 86,86"
            fill="none"
            stroke="var(--sv-magenta)"
            strokeWidth="1.8"
          />
          <polygon
            points="150,100 185,114 200,150 185,185 150,200 114,185 100,150 114,114"
            fill="none"
            stroke="var(--sv-yellow)"
            strokeWidth="1.5"
          />
          <polygon
            points="150,125 167,132 175,150 167,167 150,175 132,167 125,150 132,132"
            fill="none"
            stroke="var(--sv-cyan)"
            strokeWidth="1.2"
          />

          <circle
            cx="213"
            cy="86"
            r="6"
            fill="#FFD400"
            stroke="#111111"
            strokeWidth="2"
            className="animate-bounce"
          />
          <circle
            cx="86"
            cy="213"
            r="6"
            fill="#00E5FF"
            stroke="#111111"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle
            cx="240"
            cy="150"
            r="5"
            fill="#FF2E63"
            stroke="#111111"
            strokeWidth="2"
          />
          <circle
            cx="60"
            cy="150"
            r="5"
            fill="#10B981"
            stroke="#111111"
            strokeWidth="2"
          />

          <circle
            cx="150"
            cy="150"
            r="22"
            fill="#111111"
            stroke="var(--sv-magenta)"
            strokeWidth="3"
          />
          <path
            d="M150 138 C144 138 140 144 140 150 C140 156 144 162 150 162 C156 162 160 156 160 150 C160 144 156 138 150 138 Z"
            fill="var(--sv-magenta)"
          />

          <path
            d="M140 144 Q130 135 125 142 M160 144 Q170 135 175 142"
            stroke="var(--sv-yellow)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M140 150 Q126 150 120 156 M160 150 Q174 150 180 156"
            stroke="var(--sv-yellow)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M140 156 Q130 165 125 160 M160 156 Q170 165 175 160"
            stroke="var(--sv-yellow)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        <div className="absolute -bottom-2 text-center z-20">
          <span className="ono text-3xl sm:text-4xl tracking-widest text-[var(--sv-magenta)] drop-shadow-[3px_3px_0_#111111] animate-pulse">
            BZZZZT!
          </span>
        </div>
      </div>

      <div className="mt-3 z-10">
        <h4 className="font-['Archivo_Black'] text-sm uppercase tracking-wider text-[var(--sv-yellow)] mb-1">
          RADAR SWEEP COMPLETE • GRID SECURE
        </h4>
        <p className="text-xs font-mono text-[var(--subtext)] max-w-md mx-auto">
          {filter !== "ALL"
            ? `No active policy diffs or hazards matching filter "${filter}".`
            : "No active legal policy diffs or product recall hazards detected across all monitored web nodes."}
        </p>
      </div>
    </div>
  );
}

function ScannerSkeletonRows() {
  return (
    <div className="flex flex-col gap-3 py-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden border-2 border-[#111111] bg-[var(--input-bg)] p-4 shadow-[3px_3px_0_#111111] h-24"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--sv-cyan)]/10 to-transparent animate-[shimmer_1.5s_infinite]" />
          <div className="h-4 w-24 bg-gray-400/20 border border-[#111111] mb-2" />
          <div className="h-3 w-3/4 bg-gray-400/20 border border-[#111111]" />
        </div>
      ))}
    </div>
  );
}
