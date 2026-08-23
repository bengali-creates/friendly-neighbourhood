"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  Database,
  Cpu,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

interface ScraperProgressLoaderProps {
  jobId?: string | null;
  collectorId?: string | null;
  targetUrl?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface JobState {
  jobId: string;
  status: string;
  progress: number;
  currentStep: string;
  bytesScraped: number;
  itemsScraped: number;
  updatedAt: string;
}

export function ScraperProgressLoader({
  jobId,
  collectorId,
  targetUrl,
  onComplete,
  onCancel,
}: ScraperProgressLoaderProps) {
  const [job, setJob] = useState<JobState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    
  useEffect(() => {
    try {
      const saved = localStorage.getItem("spider_loader_collapsed");
      if (saved === "true") setIsCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("spider_loader_collapsed", String(next));
      } catch {}
      return next;
    });
  };

    
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

    
  useEffect(() => {
    let isMounted = true;

    const fetchProgress = async () => {
      if (!jobId && !collectorId) return;

      try {
        const queryParam = jobId
          ? `jobId=${encodeURIComponent(jobId)}`
          : `collectorId=${encodeURIComponent(collectorId!)}`;
        const res = await fetch(`/api/jobs?${queryParam}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.found && json.data) {
            if (isMounted) {
              setJob(json.data);
              if (
                json.data.status === "completed" ||
                json.data.progress >= 100
              ) {
                setIsCompleted(true);
                if (onComplete) onComplete();
                  
                setTimeout(() => {
                  if (onCancel) onCancel();
                }, 4000);
              }
            }
          }
        }
      } catch (err) {
        console.error("[Telemetry] Failed to poll scraper status:", err);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobId, collectorId, onComplete]);

  const progressPct = isCompleted
    ? 100
    : job
      ? Math.min(100, Math.max(5, job.progress))
      : 15;
  const stepText = isCompleted
    ? "Scan complete — baseline snapshot saved & verified"
    : job?.currentStep || "Initializing Proxy Collector...";
  const bytesText = job?.bytesScraped
    ? `${(job.bytesScraped / 1024).toFixed(1)} KB`
    : "Streaming DOM";
  const itemsText = job?.itemsScraped
    ? `${job.itemsScraped} records`
    : "Scanning nodes";

  const phases = [
    { label: "Initialize Proxy Pipeline", minProg: 15 },
    { label: "Extract Target Snapshot", minProg: 40 },
    { label: "Schema Validation & Self-Heal", minProg: 55 },
    { label: "Differential Baseline Analysis", minProg: 70 },
    { label: "AI Policy Impact Synthesis", minProg: 90 },
  ];

    
  if (isCollapsed) {
    return (
      <div className="relative border-2 border-[#111111] bg-[var(--card-bg)] text-[var(--card-text)] p-2.5 shadow-[3px_3px_0_var(--shadow-color)] rounded-sm transition-all flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--sv-cyan)] shrink-0" />
          )}
          <span className="caption caption--cyan text-[9px] px-1.5 py-0.5 shrink-0">
            {isCompleted ? "COMPLETED" : `${progressPct}%`}
          </span>
          <span className="text-xs font-mono truncate text-[var(--card-text)]">
            {stepText}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 font-mono text-[10px]">
          <span className="text-[var(--subtext)]">{elapsedSeconds}s</span>
          <button
            onClick={toggleCollapse}
            className="btn btn--ghost text-[10px] px-1.5 py-0.5 flex items-center"
            title="Expand Telemetry Details"
          >
            <ChevronDown className="w-3 h-3 mr-0.5" /> EXPAND
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-[var(--subtext)] hover:text-red-400 p-0.5"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

    
  return (
    <div className="relative border-3 border-[#111111] bg-[var(--card-bg)] text-[var(--card-text)] p-5 shadow-[6px_6px_0_var(--shadow-color)] rounded-sm transition-all">
      <div className="flex items-center justify-between mb-3 border-b-2 border-[#111111] pb-3">
        <div className="flex items-center space-x-3">
          <span className="caption caption--cyan">
            {isCompleted ? "SCAN COMPLETED" : "LIVE RADAR SCAN"}
          </span>
          {/* {targetUrl && (
            <span className="font-['Archivo_Black'] uppercase text-xs tracking-wider text-[var(--card-text)] truncate max-w-xs">
              {targetUrl}
            </span>
          )} */}
        </div>

        <div className="flex items-center space-x-2">
          <div className="badge badge--warning font-mono text-xs">
            <Activity className="w-3.5 h-3.5 mr-1 animate-pulse" />
            {progressPct}%
          </div>
          <button
            onClick={toggleCollapse}
            className="btn btn--ghost text-[10px] px-2 py-0.5 flex items-center"
            title="Minimize to Compact Bar"
          >
            <ChevronUp className="w-3 h-3 mr-0.5" /> MINIMIZE
          </button>
        </div>
      </div>

      <div className="relative mb-4 h-3 w-full border-2 border-[#111111] bg-[var(--input-bg)] shadow-[2px_2px_0_#111111] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--sv-yellow)] via-[var(--sv-magenta)] to-[var(--sv-cyan)] transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mb-4 flex items-center justify-between p-2.5 bg-[var(--input-bg)] border-2 border-[#111111] shadow-[3px_3px_0_#111111]">
        <div className="flex items-center space-x-2 min-w-0">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--sv-cyan)] shrink-0" />
          )}
          <span className="text-xs font-mono text-[var(--card-text)] truncate">
            {stepText}
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--subtext)] shrink-0 ml-2">
          {elapsedSeconds}s
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3 font-mono text-xs">
        <div className="p-2 bg-[var(--input-bg)] border-2 border-[#111111] shadow-[2px_2px_0_#111111]">
          <div className="text-[10px] uppercase font-['Archivo_Black'] text-[var(--subtext)]">
            Data Stream
          </div>
          <div className="font-bold text-[var(--card-text)] mt-0.5 flex items-center">
            <Database className="w-3.5 h-3.5 mr-1 text-[var(--sv-cyan)]" />
            {bytesText}
          </div>
        </div>
        <div className="p-2 bg-[var(--input-bg)] border-2 border-[#111111] shadow-[2px_2px_0_#111111]">
          <div className="text-[10px] uppercase font-['Archivo_Black'] text-[var(--subtext)]">
            DOM Records
          </div>
          <div className="font-bold text-[var(--card-text)] mt-0.5 flex items-center">
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-[var(--sv-yellow)]" />
            {itemsText}
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 p-2 bg-[var(--input-bg)] border-2 border-[#111111] shadow-[2px_2px_0_#111111]">
          <div className="text-[10px] uppercase font-['Archivo_Black'] text-[var(--subtext)]">
            Phase Status
          </div>
          <div className="font-bold text-[var(--sv-magenta)] mt-0.5 uppercase text-[11px] tracking-wider truncate">
            {job?.status || "Processing"}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 border-t-2 border-[#111111] pt-3">
        {phases.map((phase, idx) => {
          const done = progressPct >= phase.minProg;
          const current =
            progressPct < phase.minProg &&
            (idx === 0 || progressPct >= phases[idx - 1].minProg);

          return (
            <div
              key={idx}
              className="flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center space-x-2">
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : current ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--sv-cyan)]" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-none border-2 border-[#111111] bg-gray-400/20" />
                )}
                <span
                  className={
                    done
                      ? "text-[var(--card-text)] font-semibold"
                      : current
                        ? "text-[var(--sv-cyan)] font-bold"
                        : "text-[var(--subtext)]"
                  }
                >
                  {phase.label}
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono text-[var(--subtext)]">
                {done ? "Done" : current ? "Active" : "Queued"}
              </span>
            </div>
          );
        })}
      </div>

      {onCancel && !isCompleted && (
        <div className="mt-4 text-right">
          <button
            onClick={onCancel}
            className="btn btn--ghost text-[10px] px-2 py-1"
          >
            DISMISS
          </button>
        </div>
      )}
    </div>
  );
}
