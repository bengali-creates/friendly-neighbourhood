"use client";
import AgentLogPanel from "@/components/AgentLogPanel";

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-['Bangers'] text-3xl tracking-wide text-[var(--fg)]">AGENTIC AI EXECUTION LOGS</h1>
        <p className="text-xs text-[var(--subtext)] font-sans">Live telemetry, LangGraph execution trace, and prompt output</p>
      </div>

      <AgentLogPanel />
    </div>
  );
}
