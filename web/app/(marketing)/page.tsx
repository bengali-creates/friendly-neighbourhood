import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Radar, Zap, ArrowRight, ShieldCheck, FileText, RefreshCw, Play, CheckCircle2 } from "lucide-react";
import InteractiveMockupHero from "@/components/InteractiveMockupHero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4EBD9] text-[#0B0714] font-sans selection:bg-[var(--sv-magenta)] selection:text-white relative">
      
      <header className="border-b-3 border-[#0B0714] bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_0_#0B0714]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--sv-magenta)] border-2 border-[#0B0714] flex items-center justify-center shadow-[3px_3px_0_#0B0714]">
            <Radar className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="font-['Bangers'] text-3xl tracking-wider text-[#0B0714]">SPIDER-SENSE</span>
          <Badge variant="info" className="hidden sm:inline-flex">PERSONAL AI RADAR</Badge>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="magenta" size="sm" className="gap-1.5">
              Launch Control Room <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      
      <section className="relative px-4 md:px-8 py-12 md:py-20 max-w-7xl mx-auto flex flex-col items-center text-center">
        <Badge variant="warning" className="mb-4 px-3.5 py-1 text-xs">
          ⚡ AUTONOMOUS LEGAL & RECALL RADAR
        </Badge>

        <h1 className="font-['Bangers'] text-5xl md:text-7xl tracking-wider text-[#0B0714] max-w-4xl leading-tight mb-4 drop-shadow-[3px_3px_0_#0B0714] misreg" data-text="SPIDER-SENSE AI">
          SPIDER-SENSE AI
        </h1>

        <p className="text-base md:text-lg text-[#0B0714]/80 max-w-2xl font-sans mb-8 leading-relaxed font-medium">
          An autonomous AI radar powered by Bright Data Scraper Studio & Gemini 3.6 Flash. It continuously scans legal policies, matches household items with safety recalls, and self-heals broken web scrapers.
        </p>

        
        <InteractiveMockupHero />

        
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="magenta" size="lg" className="w-full gap-2 text-sm shadow-[5px_5px_0_#0B0714]">
              <Zap className="w-4 h-4" /> Enter Live Radar Room
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="yellow" size="lg" className="w-full text-sm shadow-[5px_5px_0_#0B0714]">
              Sign In to Your Station
            </Button>
          </Link>
        </div>
      </section>

      
      <section className="px-6 py-16 max-w-6xl mx-auto w-full border-t-3 border-[#0B0714] mt-12">
        <div className="text-center mb-12">
          <span className="caption caption--cyan mb-2">HOW IT WORKS</span>
          <h2 className="font-['Bangers'] text-4xl text-[#0B0714] tracking-wide">
            THREE TIERS OF SPIDER-SENSE PROTECTION
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 comic-panel bg-white flex flex-col justify-between hover:-translate-y-1 transition-all">
            <div>
              <div className="w-10 h-10 bg-[var(--sv-magenta)] border-2 border-[#0B0714] flex items-center justify-center shadow-[3px_3px_0_#0B0714] mb-4">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <Badge variant="critical" className="mb-2">ToS Policy Radar</Badge>
              <h3 className="font-['Archivo_Black'] text-base text-[#0B0714] mb-2">Autonomous Diffing</h3>
              <p className="text-xs text-[#0B0714]/70 leading-relaxed">
                Scrapes Terms of Service & Privacy Policies continuously. AI filters extract exact fee hikes, data-sharing clauses, and arbitration traps into plain English.
              </p>
            </div>
          </Card>

          <Card className="p-6 comic-panel bg-white flex flex-col justify-between hover:-translate-y-1 transition-all">
            <div>
              <div className="w-10 h-10 bg-[var(--sv-yellow)] border-2 border-[#0B0714] flex items-center justify-center shadow-[3px_3px_0_#0B0714] mb-4">
                <ShieldCheck className="w-5 h-5 text-[#0B0714]" />
              </div>
              <Badge variant="warning" className="mb-2">Things I Own</Badge>
              <h3 className="font-['Archivo_Black'] text-base text-[#0B0714] mb-2">CPSC Recall Matcher</h3>
              <p className="text-xs text-[#0B0714]/70 leading-relaxed">
                Add your household electronics and appliances. Spider-Sense fuzzy-matches product model numbers against federal recall registries in real time.
              </p>
            </div>
          </Card>

          <Card className="p-6 comic-panel bg-white flex flex-col justify-between hover:-translate-y-1 transition-all">
            <div>
              <div className="w-10 h-10 bg-[var(--sv-cyan)] border-2 border-[#0B0714] flex items-center justify-center shadow-[3px_3px_0_#0B0714] mb-4">
                <RefreshCw className="w-5 h-5 text-[#0B0714]" />
              </div>
              <Badge variant="info" className="mb-2">Self-Healing AI</Badge>
              <h3 className="font-['Archivo_Black'] text-base text-[#0B0714] mb-2">Scraper Healing</h3>
              <p className="text-xs text-[#0B0714]/70 leading-relaxed">
                When target site HTML changes, Bright Data AI self-heals the selector pipeline instantly without breaking your alerts or requiring code edits.
              </p>
            </div>
          </Card>
        </div>
      </section>

      
      <footer className="border-t-3 border-[#0B0714] bg-white px-6 py-6 mt-auto text-center text-xs text-[#0B0714]/70 font-mono">
        Spider-Sense AI Engine • Powered by Bright Data Scraper Studio & Gemini 3.6 Flash
      </footer>
    </div>
  );
}
