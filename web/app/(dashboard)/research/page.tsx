"use client";
import ResearchPanel from "@/components/ResearchPanel";

export default function ResearchPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">Keyword Research & Positions</h1>
        <p className="text-xs text-[var(--ink-secondary)] mt-0.5">Synthesize web research via Bright Data search & Gemini 3.6 into balanced Stance A vs Stance B positions</p>
      </div>

      <ResearchPanel />
    </div>
  );
}
