"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useSources } from "@/lib/queries";

export default function AlertDrawer() {
  const { selectedAlert, closeAlert } = useStore();
  const { data: sourcesData } = useSources(selectedAlert?.id ?? null);
  const sources = sourcesData?.data ?? [];

  const severityColor: Record<string, string> = {
    CRITICAL: "var(--sv-magenta)",
    WARNING:  "var(--sv-yellow)",
    INFO:     "var(--sv-cyan)",
  };

  return (
    <AnimatePresence>
      {selectedAlert && (
        <>
          
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeAlert}
          />

          
          <motion.aside
            className="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
          >
            
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <span className="caption caption--red">{selectedAlert.severity}</span>
              <button
                onClick={closeAlert}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--sv-ink)", lineHeight: 1 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", lineHeight: 1.4, marginBottom: 20, color: "var(--sv-ink)" }}>
              {selectedAlert.message}
            </p>

            <hr style={{ border: "none", borderTop: "2px solid var(--sv-ink)", marginBottom: 20 }} />

            
            {selectedAlert.positionA && (
              <Section title="POSITION A — PRIMARY RISK">
                <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--sv-ink)" }}>{selectedAlert.positionA}</p>
              </Section>
            )}

            
            {selectedAlert.positionB && (
              <Section title="POSITION B — ALTERNATIVE VIEW">
                <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--sv-ink)" }}>{selectedAlert.positionB}</p>
              </Section>
            )}

            
            {selectedAlert.draftScript && (
              <Section title="ACTION SCRIPT — COPY & SEND">
                <pre style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                  background: "var(--sv-ink)",
                  color: "var(--sv-cyan)",
                  padding: 12,
                  border: "2px solid var(--sv-ink)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: 1.6,
                }}>
                  {selectedAlert.draftScript}
                </pre>
                <button
                  className="btn btn--yellow"
                  style={{ marginTop: 8 }}
                  onClick={() => navigator.clipboard.writeText(selectedAlert.draftScript!)}
                >
                  Copy script
                </button>
              </Section>
            )}

            
            {sources.length > 0 && (
              <Section title={`SOURCES (${sources.length})`}>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {sources.map((s: any) => (
                    <li key={s.id} style={{ borderLeft: "3px solid var(--sv-cyan)", paddingLeft: 10 }}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--sv-ink)", display: "block", lineHeight: 1.3 }}
                      >
                        {s.title}
                      </a>
                      {s.snippet && (
                        <p style={{ fontSize: "0.73rem", color: "#555", marginTop: 3, lineHeight: 1.4 }}>
                          {s.snippet.slice(0, 140)}…
                        </p>
                      )}
                      <span className="caption" style={{ marginTop: 4 }}>{s.sourceType}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <span className="caption" style={{ marginBottom: 10, display: "block" }}>{title}</span>
      {children}
    </section>
  );
}
