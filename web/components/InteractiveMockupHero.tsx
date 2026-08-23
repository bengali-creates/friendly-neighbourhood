"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InteractiveMockupHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

    
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -10]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.98]);

  const [scanActive, setScanActive] = useState(false);
  const [scanMessage, setScanMessage] = useState("Click any interactive button on this mockup to test the radar live!");

  const handleTestScan = (name: string) => {
    setScanActive(true);
    setScanMessage(`Scanning ${name} via Bright Data Scraper Studio & Gemini 3.6…`);
    setTimeout(() => {
      setScanActive(false);
      setScanMessage(`✓ ${name} scanned! Policy change detected: New arbitration clause added.`);
    }, 1800);
  };

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto perspective-1000 my-4">
      <motion.div
        style={{ rotateX, scale }}
        transition={{ type: "spring", damping: 20, stiffness: 120 }}
        className="comic-panel comic-panel--cream border-4 border-[#0B0714] shadow-[10px_10px_0_#0B0714] p-4 md:p-6 text-left relative overflow-hidden"
      >
        
        <div className="border-b-3 border-[#0B0714] pb-4 mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 comic-panel border-2 border-[#0B0714]">
          <div>
            <h2 className="font-['Bangers'] text-4xl tracking-wider text-[#0B0714] misreg" data-text="SPIDER-SENSE MOCKUP">
              SPIDER-SENSE MOCKUP
            </h2>
            <p className="text-xs font-mono text-[#0B0714]/70">INTERACTIVE ONE-STOP DEMO — CLICK ANY BUTTON</p>
          </div>
          <Link href="/dashboard">
            <button className="btn btn--primary text-xs py-2 px-4 shadow-[4px_4px_0_#0B0714]">
              Launch Real Control Room <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </Link>
        </div>

        
        <div className="mb-6 p-3 bg-[var(--sv-yellow)] border-2 border-[#0B0714] shadow-[3px_3px_0_#0B0714] flex items-center justify-between text-xs font-bold font-mono">
          <span className="truncate">{scanMessage}</span>
          {scanActive && <span className="badge badge--critical animate-pulse">SCANNING</span>}
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          
          <div className="lg:col-span-4 comic-panel bg-white border-2 border-[#0B0714] shadow-[4px_4px_0_#0B0714] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-2">
              <h3 className="font-['Bangers'] text-xl text-[#0B0714]">THINGS I OWN</h3>
              <span className="caption caption--cyan text-[9px]">RECALL RADAR</span>
            </div>

            <div className="flex flex-col gap-2">
              <MockupItem name="Anker PowerBank 537" status="ALERT" onTest={() => handleTestScan("Anker PowerBank")} />
              <MockupItem name="LG Smart Fridge" status="CLEAR" onTest={() => handleTestScan("LG Smart Fridge")} />
              <MockupItem name="Tesla Charger" status="CLEAR" onTest={() => handleTestScan("Tesla Charger")} />
              <MockupItem name="Dyson Vacuum" status="ALERT" onTest={() => handleTestScan("Dyson Vacuum")} />
            </div>
          </div>

          
          <div className="lg:col-span-4 comic-panel bg-white border-2 border-[#0B0714] shadow-[4px_4px_0_#0B0714] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-2">
              <h3 className="font-['Bangers'] text-xl text-[#0B0714]">SERVICES I USE</h3>
              <span className="caption text-[9px]">POLICY MONITOR</span>
            </div>

            <div className="flex flex-col gap-2">
              <MockupService name="Instagram Legal Terms" onTest={() => handleTestScan("Instagram Terms")} />
              <MockupService name="PayPal Privacy Policy" onTest={() => handleTestScan("PayPal Privacy")} />
              <MockupService name="Amazon Prime Terms" onTest={() => handleTestScan("Amazon Prime")} />
              <MockupService name="Spotify Service Terms" onTest={() => handleTestScan("Spotify Terms")} />
            </div>
          </div>

          
          <div className="lg:col-span-4 comic-panel bg-white border-2 border-[#0B0714] shadow-[4px_4px_0_#0B0714] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-2">
              <h3 className="font-['Bangers'] text-xl text-[#0B0714]">ACTIVITY FEED</h3>
              <span className="badge badge--critical text-[9px]">LIVE ALERTS</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleTestScan("Anker Recalled Notice")}
                className="text-left comic-panel bg-[#F4EBD9] border-2 border-[#0B0714] p-2.5 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span className="badge badge--critical text-[9px] mb-1">CRITICAL</span>
                <p className="font-sans text-xs font-bold text-[#0B0714]">ANKER POWERBANK RECALLED!</p>
                <p className="text-[10px] text-[#0B0714]/70 mt-1">Fire hazard detected in lithium battery batch.</p>
              </button>

              <button
                onClick={() => handleTestScan("Instagram Policy Change")}
                className="text-left comic-panel bg-[#F4EBD9] border-2 border-[#0B0714] p-2.5 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span className="badge badge--warning text-[9px] mb-1">WARNING</span>
                <p className="font-sans text-xs font-bold text-[#0B0714]">INSTAGRAM TOS CHANGED</p>
                <p className="text-[10px] text-[#0B0714]/70 mt-1">New AI content training opt-out clause added.</p>
              </button>
            </div>
          </div>

          
          <div className="lg:col-span-6 comic-panel bg-white border-2 border-[#0B0714] shadow-[4px_4px_0_#0B0714] p-4">
            <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-2 mb-3">
              <h3 className="font-['Bangers'] text-xl text-[#0B0714]">SCRAPER HEALTH</h3>
              <span className="caption caption--cyan text-[9px]">AUTO-HEALING TELEMETRY</span>
            </div>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="p-2 bg-[#0B0714] text-white flex items-center justify-between">
                <span>pipeline → Instagram Selector</span>
                <span className="badge badge--broken text-[9px]">BROKEN</span>
              </div>
              <div className="p-2 bg-[var(--sv-purple)] text-white flex items-center justify-between">
                <span>pipeline → Bright Data AI Repair</span>
                <span className="badge badge--healed text-[9px]">HEALED</span>
              </div>
            </div>
          </div>

          
          <div className="lg:col-span-6 comic-panel bg-white border-2 border-[#0B0714] shadow-[4px_4px_0_#0B0714] p-4">
            <div className="flex items-center justify-between border-b-2 border-[#0B0714] pb-2 mb-3">
              <h3 className="font-['Bangers'] text-xl text-[#0B0714]">AGENTIC AI BRAIN</h3>
              <span className="caption caption--red text-[9px]">GEMINI 3.6 FLASH</span>
            </div>
            <div className="p-3 bg-[#0B0714] text-[#00E5FF] font-mono text-xs leading-relaxed">
              <p className="text-white/80 mb-2">&gt; Agent analyzing policy diff & drafting opt-out script…</p>
              <button
                onClick={() => handleTestScan("Draft Script Generation")}
                className="btn btn--yellow text-[10px] py-1 px-3"
              >
                Test Script Generator
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

function MockupItem({ name, status, onTest }: { name: string; status: "ALERT" | "CLEAR"; onTest: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 bg-[#F4EBD9] border border-[#0B0714]">
      <span className="font-['Archivo_Black'] text-xs text-[#0B0714]">{name}</span>
      <button
        onClick={onTest}
        className={`badge cursor-pointer ${status === "ALERT" ? "badge--critical" : "badge--healed"}`}
      >
        {status}
      </button>
    </div>
  );
}

function MockupService({ name, onTest }: { name: string; onTest: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 bg-[#F4EBD9] border border-[#0B0714]">
      <span className="font-['Archivo_Black'] text-xs text-[#0B0714] truncate pr-2">{name}</span>
      <button onClick={onTest} className="btn btn--yellow text-[9px] py-0.5 px-2">
        <Play className="w-2.5 h-2.5 inline mr-1" /> Scan
      </button>
    </div>
  );
}
