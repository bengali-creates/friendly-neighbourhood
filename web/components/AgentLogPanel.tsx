"use client";
import { useStore } from "@/lib/store";

export default function AgentLogPanel() {
  const { agentLog, agentStatus, clearLog } = useStore();

  return (
    <div className="panel" style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="caption">Agentic AI — Live Log</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`badge ${agentStatus === "running" ? "badge--warning" : agentStatus === "error" ? "badge--critical" : "badge--healed"}`}>
            {agentStatus}
          </span>
          <button className="btn" style={{ padding: "2px 8px", fontSize: "0.6rem" }} onClick={clearLog}>
            Clear
          </button>
        </div>
      </div>

      
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: "0.72rem",
        background: "var(--sv-ink)",
        color: "var(--sv-cyan)",
        padding: 12,
        minHeight: 160,
        maxHeight: 300,
        overflowY: "auto",
        border: "2px solid var(--sv-ink)",
        lineHeight: 1.7,
        letterSpacing: "0.02em",
      }}>
        {agentLog.length === 0 ? (
          <span style={{ opacity: 0.4 }}>Agent idle. No log output yet.</span>
        ) : (
          agentLog.map((line, i) => (
            <div key={i}>
              <span style={{ opacity: 0.4 }}>&gt; </span>{line}
            </div>
          ))
        )}
      </div>

      <p style={{ fontSize: "0.7rem", opacity: 0.5, lineHeight: 1.5 }}>
        An autonomous agent monitors your services — diffing policy text, classifying changes, researching articles, and drafting action scripts.
      </p>
    </div>
  );
}
