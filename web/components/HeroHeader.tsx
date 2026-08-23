"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { useAlerts } from "@/lib/queries";

export default function HeroHeader() {
  const { flashMessage, agentStatus } = useStore();
  const { data } = useAlerts();
  const alerts = data?.data ?? [];
  const criticalCount = alerts.filter((a: any) => a.severity === "CRITICAL").length;

  return (
    <header className="panel border-b-2 border-black bg-[#141026] px-6 py-4 flex items-center justify-between relative overflow-hidden rounded-none">
      
      <div className="flex items-center gap-3">
        <h1 className="font-['Bangers'] text-3xl md:text-4xl tracking-wider text-[var(--sv-magenta)] drop-shadow-[2px_2px_0_#000000]">
          SPIDER-SENSE
        </h1>
        <span className="caption caption--cyan hidden sm:inline-block">PERSONAL AI RADAR</span>
      </div>

      
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {criticalCount > 0 && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="badge badge--critical text-xs px-3 py-1"
            >
              ⚠ {criticalCount} CRITICAL
            </motion.span>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 px-3 py-1 bg-[#090713] border border-white/10 rounded text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              agentStatus === "running"
                ? "bg-[var(--sv-yellow)] animate-pulse"
                : agentStatus === "error"
                ? "bg-[var(--sv-magenta)]"
                : "bg-green-400"
            }`}
          />
          <span className="uppercase text-[10px] tracking-wider opacity-80">{agentStatus}</span>
        </div>
      </div>

      
      <AnimatePresence>
        {flashMessage && (
          <motion.div
            key={flashMessage}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-[var(--sv-yellow)] text-black border-2 border-black px-4 py-1 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_#000000] z-20"
          >
            {flashMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
