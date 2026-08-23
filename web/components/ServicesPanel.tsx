"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCollectors, useRunAgent } from "@/lib/queries";
import { useRadarStore } from "@/lib/radarStore";
import { useAgentStore } from "@/lib/agentStore";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Play,
  Globe,
  AlertTriangle,
  FileText,
  Eye,
} from "lucide-react";
import { ScraperProgressLoader } from "@/components/ScraperProgressLoader";
import { NotificationPanel } from "@/components/NotificationPanel";

const SOURCE_ICON: Record<string, any> = {
  tos: FileText,
  recall: AlertTriangle,
  civic: Shield,
  search: Globe,
};

export default function ServicesPanel() {
  const { data, isLoading } = useCollectors();
  const collectors = data?.data ?? [];
  const { flash } = useRadarStore();
  const { setAgentStatus } = useAgentStore();
  const runAgent = useRunAgent();

  const [activeRun, setActiveRun] = useState<{
    jobId?: string;
    collectorId: string;
    targetUrl: string;
  } | null>(null);

  const handleRun = async (c: any) => {
    setAgentStatus("running");
    flash(`Scanning ${c.name}…`);
    setActiveRun({
      collectorId: c.collectorId,
      targetUrl: c.url,
    });

    try {
      console.log({ c });
      const res = await runAgent.mutateAsync({
        collector_id: c.collectorId,
        url: c.url,
        source_type: c.sourceType,
      });

      if (res?.job_id) {
        setActiveRun({
          jobId: res.job_id,
          collectorId: c.collectorId,
          targetUrl: c.url,
        });
        if (res.source === "database_cache") {
            
          setTimeout(() => setActiveRun(null), 1500);
        }
      } else {
        setActiveRun(null);
      }

      setAgentStatus("idle");
      flash(`✓ ${c.name} scan complete`);
    } catch {
      setAgentStatus("error");
      flash(`✗ Error scanning ${c.name}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--sv-cyan)]" /> Monitored
            Services
          </CardTitle>
          <CardDescription className="mt-1">
            Active scrapers & ToS policy collectors
          </CardDescription>
        </div>
        <div className="flex items-center space-x-3">
          <NotificationPanel />
          <Badge variant="info">ACTIVE</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeRun && (
          <ScraperProgressLoader
            jobId={activeRun.jobId}
            collectorId={activeRun.collectorId}
            targetUrl={activeRun.targetUrl}
            onCancel={() => setActiveRun(null)}
          />
        )}

        {isLoading && (
          <div className="space-y-2.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="skeleton h-14 border-2 border-[var(--card-border)] rounded-md"
              />
            ))}
          </div>
        )}

        {!isLoading && collectors.length === 0 && (
          <div className="p-4 bg-[var(--input-bg)] border-2 border-[var(--card-border)] text-xs font-mono text-[var(--subtext)] text-center rounded-md">
            No services monitored yet. Add a URL to begin.
          </div>
        )}

        <div className="space-y-3">
          {collectors.map((c: any, i: number) => {
            const Icon = SOURCE_ICON[c.sourceType] ?? Globe;
            const isScanningThis = activeRun?.collectorId === c.collectorId;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 bg-[var(--input-bg)] border-2 border-[var(--card-border)] shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[5px_5px_0_var(--shadow-color)] transition-all rounded-md"
              >
                <div className="w-8 h-8 rounded bg-[var(--sv-cyan)]/20 border border-[var(--card-border)] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[var(--sv-cyan)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-['Archivo_Black'] uppercase text-[var(--card-text)] truncate">
                    {c.name}
                  </p>
                  <p className="text-[10px] opacity-70 font-mono truncate text-[var(--sv-cyan)]">
                    {c.url}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href={`/scrapers/${c.collectorId}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-['Bangers'] text-xs tracking-wider border border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[var(--sv-cyan)] hover:text-black"
                      title="View Scraped Key-Value Data & Baseline Diffs"
                    >
                      <Eye className="w-3 h-3 mr-1" /> VIEW
                    </Button>
                  </Link>
                  <Button
                    variant="yellow"
                    size="sm"
                    onClick={() => handleRun(c)}
                    disabled={runAgent.isPending || isScanningThis}
                    className="font-['Bangers'] text-xs tracking-wider"
                  >
                    <Play className="w-3 h-3 mr-1" />{" "}
                    {isScanningThis ? "SCANNING..." : "SCAN"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
