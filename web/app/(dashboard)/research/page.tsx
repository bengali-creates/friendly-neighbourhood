"use client";
import ResearchPanel from "@/components/ResearchPanel";

export default function ResearchPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-['Bangers'] text-3xl tracking-wide text-[var(--fg)]">KEYWORD RESEARCH & UNIFIED POSITIONS</h1>
        <p className="text-xs text-[var(--subtext)] font-sans">Synthesize web research via Bright Data search & Gemini 3.6 into balanced Stance A vs Stance B positions</p>
      </div>

      <ResearchPanel />
    </div>
  );
}
