"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Radar, LayoutDashboard, Package, Shield, Search, Terminal, Cpu, LogOut, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import AlertDrawer from "@/components/AlertDrawer";
import PillNav, { PillNavItem } from "@/components/PillNav";

const NAV_ITEMS: PillNavItem[] = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "services", href: "/services", label: "Services", icon: Shield },
  { id: "inventory", href: "/inventory", label: "Things I Own", icon: Package },
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
      className={`min-h-screen flex flex-col font-sans selection:bg-[var(--sv-magenta)] selection:text-white relative transition-colors duration-200 ${
        isDark ? "bg-[#0B0714] text-[#EDEAE0]" : "bg-[#F4EBD9] text-[#0B0714]"
      }`}
    >
      
      <header
        className={`border-b-3 border-black px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_0_#000000] transition-colors duration-200 ${
          isDark ? "bg-[#141026]" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[var(--sv-magenta)] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000000] -rotate-3">
              <Radar className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className={`font-['Bangers'] text-3xl tracking-wider ${isDark ? "text-white" : "text-[#0B0714]"}`}>
              SPIDER-SENSE
            </span>
          </Link>
          <Badge variant="info" className="hidden sm:inline-flex text-[10px]">CONTROL ROOM</Badge>
        </div>

        
        <div className="flex items-center gap-3">
          
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_#000000] font-['Bangers'] tracking-wider text-xs cursor-pointer transition-all ${
              isDark ? "bg-[#FFD400] text-black" : "bg-[#0B0714] text-white"
            }`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDark ? "LIGHT MODE" : "DARK MODE"}</span>
          </button>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_#000000] text-xs font-mono ${
              isDark ? "bg-[#0B0714]" : "bg-white"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${agentStatus === "running" ? "bg-[var(--sv-yellow)] animate-ping" : "bg-emerald-400"}`} />
            <span className="uppercase text-[10px] tracking-wider font-bold">{agentStatus}</span>
          </div>

          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-bold border-2 border-black shadow-[2px_2px_0_#000000]">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Button>
          </Link>
        </div>
      </header>

      
      <div className="flex-1  w-full mx-auto p-3 md:p-5 flex flex-col md:flex-row gap-5 ">
        
        <aside className="w-full md:w-60 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-['Bangers'] text-xl tracking-wider text-[var(--sv-yellow)]">RADAR VIEWS</span>
            <span className="caption caption--cyan text-[9px]">LIVE</span>
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
