"use client";

import AddWatchForm from "@/components/AddWatchForm";
import ServicesPanel from "@/components/ServicesPanel";
import AlertsPanel from "@/components/AlertsPanel";
import { Badge } from "@/components/ui/badge";
import { WebShooterArrival } from "@/components/WebShooterArrival";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* <WebShooterArrival delay={0} direction="left">
        <div className="rounded-[var(--radius-lg)] bg-[var(--depth)] border border-[var(--rim)] p-5 md:p-6 flex items-center justify-between flex-wrap gap-4 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--watchful)] shadow-[0_0_8px_rgba(196,181,253,0.8)]" />
              <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--ink-secondary)]">RADAR CONTROL ROOM</span>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--ink-primary)]">Autonomous Monitoring Feed</h1>
            <p className="text-xs text-[var(--ink-secondary)] mt-0.5">Live tracking for active service ToS diffs, consumer telemetry & product recalls</p>
          </div>
          <Badge variant="info" className="text-xs px-3 py-1 gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--watchful)] animate-pulse" />
            Agent Active
          </Badge>
        </div>
      </WebShooterArrival> */}

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
