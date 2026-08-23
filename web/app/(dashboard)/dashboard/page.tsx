"use client";

import AddWatchForm from "@/components/AddWatchForm";
import ServicesPanel from "@/components/ServicesPanel";
import AlertsPanel from "@/components/AlertsPanel";
import { Badge } from "@/components/ui/badge";
import { WebShooterArrival } from "@/components/WebShooterArrival";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <WebShooterArrival delay={0} direction="left">
        <div className="comic-panel bg-[var(--card-bg)] border-3 border-black shadow-[6px_6px_0_#000000] p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="caption caption--yellow text-[10px] mb-1">RADAR CONTROL ROOM</span>
            <h1 className="font-['Bangers'] text-3xl md:text-4xl tracking-wider text-[var(--fg)]">AUTONOMOUS MONITORING FEED</h1>
            <p className="text-xs text-[var(--subtext)] font-sans">Live tracking for active service ToS diffs & product recalls</p>
          </div>
          <Badge variant="warning" className="bg-[#FFD400] text-black border-2 border-black font-['Bangers'] tracking-widest text-xs px-3 py-1 shadow-[2px_2px_0_#000000]">
            ⚡ AGENT ACTIVE
          </Badge>
        </div>
      </WebShooterArrival>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-5 flex flex-col gap-6">
          <WebShooterArrival delay={0.12} direction="left">
            <AddWatchForm />
          </WebShooterArrival>
          <WebShooterArrival delay={0.22} direction="left">
            <ServicesPanel />
          </WebShooterArrival>
        </div>

        
        <div className="lg:col-span-7 flex flex-col gap-6">
          <WebShooterArrival delay={0.18} direction="right">
            <AlertsPanel />
          </WebShooterArrival>
        </div>
      </div>
    </div>
  );
}
