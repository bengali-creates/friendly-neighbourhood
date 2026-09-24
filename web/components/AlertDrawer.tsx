"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useSources } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Copy, ExternalLink, ShieldAlert } from "lucide-react";
import { useState } from "react";

export default function AlertDrawer() {
  const { selectedAlert, closeAlert } = useStore();
  const { data: sourcesData } = useSources(selectedAlert?.id ?? null);
  const sources = sourcesData?.data ?? [];
  const [copied, setCopied] = useState(false);

  const getSeverityVariant = (sev: string): "critical" | "warning" | "info" => {
    const s = sev?.toUpperCase();
    if (s === "CRITICAL" || s === "DANGER") return "critical";
    if (s === "WARNING") return "warning";
    return "info";
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {selectedAlert && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeAlert}
          />

          <motion.aside
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[var(--depth)] border-l border-[var(--rim)] text-[var(--ink-primary)] p-6 z-50 overflow-y-auto shadow-2xl flex flex-col gap-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--rim)]">
              <div className="flex items-center gap-2">
                <Badge variant={getSeverityVariant(selectedAlert.severity)}>
                  {selectedAlert.severity}
                </Badge>
                {selectedAlert.category && (
                  <span className="text-[11px] font-mono text-[var(--ink-tertiary)] uppercase">
                    {selectedAlert.category}
                  </span>
                )}
              </div>
              <button
                onClick={closeAlert}
                className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--ink-primary)] leading-snug">
                {selectedAlert.message}
              </h2>
            </div>

            {selectedAlert.positionA && (
              <Section title="POSITION A — PRIMARY RISK">
                <div className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--rim)] text-xs text-[var(--ink-secondary)] leading-relaxed">
                  {selectedAlert.positionA}
                </div>
              </Section>
            )}

            {selectedAlert.positionB && (
              <Section title="POSITION B — COUNTER VIEW">
                <div className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--rim)] text-xs text-[var(--ink-secondary)] leading-relaxed">
                  {selectedAlert.positionB}
                </div>
              </Section>
            )}

            {selectedAlert.draftScript && (
              <Section title="ACTION SCRIPT — COPY & EXECUTE">
                <div className="relative group">
                  <pre className="font-mono text-xs bg-[var(--void)] text-[var(--watchful)] border border-[var(--rim)] rounded-[var(--radius-sm)] p-3.5 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
                    {selectedAlert.draftScript}
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2.5 gap-1.5"
                    onClick={() => handleCopy(selectedAlert.draftScript!)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? "Copied to Clipboard" : "Copy Script"}
                  </Button>
                </div>
              </Section>
            )}

            {sources.length > 0 && (
              <Section title={`VERIFIED SOURCES (${sources.length})`}>
                <div className="flex flex-col gap-2.5">
                  {sources.map((s: any) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-[var(--radius-sm)] border border-[var(--rim)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] transition-colors"
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-[var(--ink-primary)] hover:text-[var(--watchful)] transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{s.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-[var(--ink-tertiary)]" />
                      </a>
                      {s.snippet && (
                        <p className="text-[11px] text-[var(--ink-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                          {s.snippet}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--ink-tertiary)]">
                          {s.sourceType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
    <section className="flex flex-col gap-2">
      <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-[var(--ink-tertiary)]">
        {title}
      </span>
      {children}
    </section>
  );
}
