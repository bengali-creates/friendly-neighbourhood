"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Radar, LayoutDashboard, Package, Shield, Search, Terminal, Cpu, LogOut, Sun, Moon, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import AlertDrawer from "@/components/AlertDrawer";
import PillNav, { PillNavItem } from "@/components/PillNav";

const NAV_ITEMS: PillNavItem[] = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "services", href: "/services", label: "Services", icon: Shield },
  { id: "inventory", href: "/inventory", label: "Things I Own", icon: Package },
  { id: "channels", href: "/channels", label: "Transmitters", icon: Radio },
  { id: "research", href: "/research", label: "Research", icon: Search },
  { id: "heals", href: "/heals", label: "Self-Healing", icon: Cpu },
  { id: "logs", href: "/logs", label: "Agent Logs", icon: Terminal },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { agentStatus, theme, toggleTheme } = useStore();
  const isDark = theme === "dark";

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-[var(--watchful)] selection:text-[var(--void)] relative bg-[var(--void)] text-[var(--ink-primary)] transition-colors duration-200"
    >
      <header
        className="border-b border-[var(--rim)] px-6 py-3 flex items-center justify-between sticky top-0 z-40 bg-[var(--depth)]/90 backdrop-blur-md transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--watchful-fill)] border border-[rgba(196,181,253,0.3)] flex items-center justify-center text-[var(--watchful)] transition-transform duration-200 group-hover:scale-105">
              <Radar className="w-4 h-4 text-[var(--watchful)]" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-[var(--ink-primary)] leading-none">
                Spider-Sense
              </span>
              <span className="text-[10px] text-[var(--ink-tertiary)] leading-tight tracking-wider uppercase">
                Autonomous Radar
              </span>
            </div>
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex text-[10px] ml-2">CONTROL ROOM</Badge>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--rim)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[rgba(196,181,253,0.3)] text-xs font-medium cursor-pointer transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-[#FB923C]" /> : <Moon className="w-3.5 h-3.5 text-[var(--watchful)]" />}
            <span className="hidden sm:inline text-[11px]">{isDark ? "Light" : "Dark"}</span>
          </button>

          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--rim)] bg-[var(--surface)] text-xs font-mono text-[var(--ink-secondary)]"
          >
            <span className={`w-2 h-2 rounded-full ${agentStatus === "running" ? "bg-[var(--clear)] animate-pulse" : "bg-[var(--ink-tertiary)]"}`} />
            <span className="uppercase text-[10px] tracking-wider">{agentStatus}</span>
          </div>

          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-60 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 pt-1 pb-1">
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--ink-tertiary)]">RADAR VIEWS</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--clear)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--clear)] animate-pulse" />
              LIVE
            </span>
          </div>

          <PillNav
            items={NAV_ITEMS}
            activeHref={pathname}
            orientation="vertical"
            onItemClick={(_, item) => router.push(item.href)}
          />
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <AlertDrawer />
    </div>
  );
}
