"use client";
import AgentLogPanel from "@/components/AgentLogPanel";

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">Agentic AI Execution Logs</h1>
        <p className="text-xs text-[var(--ink-secondary)] mt-0.5">Live telemetry, LangGraph execution trace, and prompt output</p>
      </div>

      <AgentLogPanel />
    </div>
  );
}
