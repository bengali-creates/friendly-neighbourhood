"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKeywordSearch } from "@/lib/queries";
import { useStore } from "@/lib/store";

export default function ResearchPanel() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<any>(null);
  const search = useKeywordSearch();
  const { flash } = useStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    flash(`Researching "${keyword}"…`);
    const data = await search.mutateAsync(keyword.trim());
    setResult(data);
    flash("✓ Research complete");
  };

  return (
    <div
      className="panel"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <span className="caption">Research — Unified Positions</span>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="e.g. Instagram privacy policy changes 2025"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          className="btn btn--primary"
          type="submit"
          disabled={search.isPending}
        >
          {search.isPending ? "…" : "Research"}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.keyword}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div
              style={{
                border: "2px solid var(--sv-ink)",
                boxShadow: "4px 4px 0 var(--sv-ink)",
                padding: "12px 14px",
                background: "var(--sv-yellow)",
                color: "var(--sv-ink)",
              }}
            >
              <span
                className="caption"
                style={{
                  background: "var(--sv-ink)",
                  color: "var(--sv-yellow)",
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Summary
              </span>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.9rem",
                  lineHeight: 1.4,
                }}
              >
                {result.summary}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <PositionCard
                label="Position A"
                color="var(--sv-magenta)"
                text={result.position_a}
              />
              <PositionCard
                label="Position B"
                color="var(--sv-cyan)"
                text={result.position_b}
              />
            </div>

            {result.sources?.length > 0 && (
              <div>
                <span
                  className="caption"
                  style={{ marginBottom: 8, display: "block" }}
                >
                  Sources ({result.sources.length})
                </span>
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {result.sources.slice(0, 6).map((s: any, i: number) => (
                    <li
                      key={i}
                      style={{
                        fontSize: "0.75rem",
                        borderLeft: "2px solid var(--sv-cyan)",
                        paddingLeft: 8,
                      }}
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--sv-cyan)" }}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PositionCard({
  label,
  color,
  text,
}: {
  label: string;
  color: string;
  text: string;
}) {
  return (
    <div
      style={{
        border: "2px solid var(--sv-ink)",
        boxShadow: "3px 3px 0 var(--sv-ink)",
        padding: 12,
      }}
    >
      <span
        className="caption"
        style={{
          background: color,
          color: "var(--sv-ink)",
          marginBottom: 8,
          display: "block",
        }}
      >
        {label}
      </span>
      <p style={{ fontSize: "0.78rem", lineHeight: 1.6, opacity: 0.9 }}>
        {text}
      </p>
    </div>
  );
}
