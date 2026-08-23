"use client";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";

type View = "dashboard" | "inventory" | "services" | "research" | "agent";

const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "inventory", label: "Things I Own", icon: "📦" },
  { id: "services", label: "Services", icon: "⚡" },
  { id: "research", label: "Research", icon: "🔎" },
  { id: "agent", label: "Agent Log", icon: "🕷" },
];

export default function Sidebar() {
  const { activeView, setView, agentStatus } = useStore();

  return (
    <nav
      className="panel"
      style={{
        gridArea: "nav",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "20px 12px",
        borderRight: "3px solid var(--sv-ink)",
        boxShadow: "none",
        borderTop: "none",
        borderBottom: "none",
        borderLeft: "none",
      }}
    >
      <div style={{ marginBottom: 24, paddingLeft: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-ono)",
            fontSize: "1.6rem",
            color: "var(--sv-magenta)",
            lineHeight: 1,
          }}
        >
          S.S.
        </span>
      </div>

      {NAV_ITEMS.map((item) => (
        <motion.button
          key={item.id}
          onClick={() => setView(item.id)}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            background:
              activeView === item.id ? "var(--sv-magenta)" : "transparent",
            color: activeView === item.id ? "var(--sv-paper)" : "var(--fg)",
            border: "2px solid",
            borderColor:
              activeView === item.id ? "var(--sv-ink)" : "transparent",
            boxShadow:
              activeView === item.id ? "3px 3px 0 var(--sv-ink)" : "none",
            fontFamily: "var(--font-display)",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 180ms ease-out, box-shadow 180ms ease-out",
          }}
        >
          <span style={{ fontSize: "1rem" }}>{item.icon}</span>
          <span style={{ flex: 1 }}>{item.label}</span>
        </motion.button>
      ))}

      <div style={{ marginTop: "auto", paddingTop: 16, paddingLeft: 4 }}>
        <AgentDot status={agentStatus} />
      </div>
    </nav>
  );
}

function AgentDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: "#4ade80",
    running: "var(--sv-yellow)",
    healed: "var(--sv-cyan)",
    error: "var(--sv-magenta)",
  };
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.7 }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: colors[status] || colors.idle,
          display: "inline-block",
          boxShadow:
            status === "running" ? `0 0 0 3px ${colors.running}40` : "none",
        }}
      />
      <span
        style={{
          fontSize: "0.65rem",
          fontFamily: "var(--font-display)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {status}
      </span>
    </div>
  );
}
