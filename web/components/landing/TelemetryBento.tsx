'use client';

import React, { useRef, useEffect, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { BentoCard } from './BentoCard';
import { MarvelDialogueCallout } from './MarvelDialogueCallout';
import { SignalWaveLeft, SignalWaveRight } from './foreground/SignalWaves';

export function TelemetryBento() {
  const containerRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const fgLeftRef = useRef<HTMLDivElement>(null);
  const fgRightRef = useRef<HTMLDivElement>(null);

  // Hidden overlay states for cards
  const [activeInspector, setActiveInspector] = useState<string | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const ctx = gsap.context(() => {
      // Individual trigger on each bento card with alternating directional entrance
      const cards = grid.children;
      Array.from(cards).forEach((card, index) => {
        const fromY = index % 2 === 0 ? 35 : 55;
        const fromX = index % 2 === 0 ? -25 : 25;

        gsap.fromTo(
          card,
          { opacity: 0, x: fromX, y: fromY, scale: 0.98 },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%', // Generous buffer before triggering
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Foreground Signal Waves (kept at z-0 behind cards)
      if (fgLeftRef.current && fgRightRef.current) {
        gsap.fromTo(
          [fgLeftRef.current, fgRightRef.current],
          { opacity: 0, y: 50 },
          {
            opacity: 0.35,
            y: 0,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="telemetry"
      className="relative min-h-screen flex flex-col justify-center py-24 sm:py-28 px-6 sm:px-10 overflow-hidden"
    >
      {/* Chapter Scrim (z: -1): Ember & Vermilion subtle telemetry glow */}
      <div
        className="pointer-events-none absolute inset-[-20%_-5%] z-[-1]"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 107, 43, 0.05), rgba(8, 6, 13, 0.93) 85%)',
        }}
        aria-hidden="true"
      />

      {/* FOREGROUND SIGNAL WAVES (z: 0 - Placed strictly behind the cards) */}
      <div
        ref={fgLeftRef}
        className="pointer-events-none absolute left-0 bottom-6 z-0 w-[260px] sm:w-[340px] opacity-0 hidden lg:block"
        aria-hidden="true"
      >
        <SignalWaveLeft />
      </div>
      <div
        ref={fgRightRef}
        className="pointer-events-none absolute right-0 top-12 z-0 w-[260px] sm:w-[340px] opacity-0 hidden lg:block"
        aria-hidden="true"
      >
        <SignalWaveRight />
      </div>

      {/* SECTION HEADER */}
      <div className="relative z-20 max-w-4xl mx-auto text-left w-full mb-12 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--line-strong)] bg-[#0e0a1b]/90 mb-4">
          <span className="w-2 h-2 rounded-full bg-[var(--ember)]" />
          <span className="text-[11px] font-mono tracking-widest text-[var(--ember)] uppercase font-semibold">
            ACT IV // MISSION TELEMETRY
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--bone)] leading-tight">
          Uncompromised extraction volume. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ember)] via-[var(--vermilion)] to-[var(--signal)]">
            Tested under hostile network conditions.
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[var(--bone-muted)] max-w-xl font-light leading-relaxed">
          Hover over each performance bento to inspect real-time benchmark telemetry and architectural breakthroughs.
        </p>
      </div>

      {/* 4-CARD LAYERED BENTO GRID (z: 30 - Topmost Layer) */}
      <div
        ref={gridRef}
        className="relative z-30 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* CARD 1 (Span 2): Live Throughput */}
        <div
          onMouseEnter={() => setActiveInspector('speed')}
          onMouseLeave={() => setActiveInspector(null)}
          className="md:col-span-2 relative"
        >
          {/* Pop-Out Chip 1: Top-Left (DNS & TLS Socket) */}
          <MarvelDialogueCallout
            isOpen={activeInspector === 'speed'}
            placement="manual"
            top={"10vh"}
            left={"-15vw"}
            notchPosition="left"
            title="V8 SOCKET"
            badge="1.8ms"
            accentColor="signal"
            delay={0}
          >
            Direct isolated socket bypasses external proxy queues. TLS handshake in 6.4ms.
          </MarvelDialogueCallout>

          {/* Pop-Out Chip 2: Top-Right (DOM Parse Velocity) */}
          <MarvelDialogueCallout
            isOpen={activeInspector === 'speed'}
            placement="top-right"
            title="DOM PARSE"
            badge="33.8ms"
            accentColor="signal"
            delay={0.08}
          >
            C++ geometry parser maps full page tree in under 34ms without layout reflows.
          </MarvelDialogueCallout>

          <BentoCard
            tag="BENCHMARK // LIVE SPEED"
            title="Sub-100ms Extraction Cycle"
            subtitle="Direct headless engine dispatch with zero intermediary proxy choke points."
            badge="120 req/sec"
            accentColor="signal"
            className="h-full min-h-[220px]"
          >
            <div className="mt-6 flex items-end justify-between border-t border-[var(--line-soft)] pt-5">
              <div>
                <div className="text-4xl sm:text-5xl font-mono font-bold text-[var(--signal)]">
                  42<span className="text-lg font-light text-[var(--bone-muted)]">ms</span>
                </div>
                <div className="text-[11px] font-mono text-[var(--bone-muted)] mt-1">
                  Average Domestic DOM Parse
                </div>
              </div>
              <div className="flex gap-1.5 items-end h-12">
                {[35, 55, 40, 75, 45, 90, 60, 85, 50, 95, 70, 42].map((val, idx) => (
                  <div
                    key={idx}
                    className="w-2.5 bg-[var(--signal)]/30 rounded-t hover:bg-[var(--signal)] transition-colors"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>
          </BentoCard>
        </div>

        {/* CARD 2: Trap Evasion Success */}
        <div
          onMouseEnter={() => setActiveInspector('evasion')}
          onMouseLeave={() => setActiveInspector(null)}
          className="relative"
        >
          {/* Pop-Out Chip 1: Top-Left (Bot Trap Neutralizer) */}
          <MarvelDialogueCallout
            isOpen={activeInspector === 'evasion'}
            placement="top-left"
            title="TRAP DEFENSE"
            badge="0 CAPTCHAS"
            accentColor="vermilion"
            delay={0}
          >
            Honeypots and zero-width sinks excised before automated navigation triggers.
          </MarvelDialogueCallout>

          {/* Pop-Out Chip 2: Bottom-Right (Akamai/Cloudflare) */}
          <MarvelDialogueCallout
            isOpen={activeInspector === 'evasion'}
            placement="manual"
            top={"10vh"}
            right={"-10vw"}
            title="AUDITED FLEET"
            badge="99.4%"
            accentColor="vermilion"
            delay={0.08}
          >
            Verified against Cloudflare Turnstile &amp; DataDome with zero IP pool bans.
          </MarvelDialogueCallout>

          <BentoCard
            tag="RELIABILITY"
            title="99.4% Evasion"
            subtitle="Honeypots neutralized in flight without IP bans."
            badge="AUDITED"
            accentColor="vermilion"
            className="h-full min-h-[220px]"
          >
            <div className="mt-6 pt-5 border-t border-[var(--line-soft)]">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[var(--vermilion)]">
                &lt; 0.06%
              </div>
              <div className="text-[11px] font-mono text-[var(--bone-muted)] mt-1">
                Anomaly Trigger Rate
              </div>
              <div className="mt-4 w-full h-1.5 bg-[#170e24] rounded-full overflow-hidden">
                <div className="w-[99.4%] h-full bg-[var(--vermilion)]" />
              </div>
            </div>
          </BentoCard>
        </div>

        {/* CARD 3: Schema Resilience */}
        <div
          onMouseEnter={() => setActiveInspector('schema')}
          onMouseLeave={() => setActiveInspector(null)}
          className="relative"
        >
          {/* Pop-Out Chip 1: Top-Right (Semantic Coordinates) */}
          <MarvelDialogueCallout
            isOpen={activeInspector === 'schema'}
            placement="top-right"
            title="AST RECOVERY"
            badge="1 CYCLE"
            accentColor="ember"
            delay={0}
          >
            Rotated class hashes (.x7q9) remapped instantly using spatial relationships.
          </MarvelDialogueCallout>

          {/* Pop-Out Chip 2: Bottom-Left (Zero Breakage) */}
          <MarvelDialogueCallout
            isOpen={activeInspector === 'schema'}
            placement="bottom-left"
            title="DRIFT SHIELD"
            badge="100% OK"
            accentColor="ember"
            delay={0.08}
          >
            Continuous schema validation guarantees zero downtime for client pipelines.
          </MarvelDialogueCallout>

          <BentoCard
            tag="ADAPTATION"
            title="Zero-Break Resiliency"
            subtitle="CSS classes mutate; semantic graph extraction remains rock solid."
            badge="SELF-HEALING"
            accentColor="ember"
            className="h-full min-h-[220px]"
          >
            <div className="mt-6 pt-5 border-t border-[var(--line-soft)]">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[var(--ember)]">
                100%
              </div>
              <div className="text-[11px] font-mono text-[var(--bone-muted)] mt-1">
                Automated AST Schema Drift Recovery
              </div>
            </div>
          </BentoCard>
        </div>

        {/* CARD 4 (Span 2): Native Engine vs Traditional Bloat */}
        <div
          onMouseEnter={() => setActiveInspector('stack')}
          onMouseLeave={() => setActiveInspector(null)}
          className="md:col-span-2 relative"
        >
          {/* Pop-Out Chip 1: Top-Left (Cost Efficiency) */}
          <MarvelDialogueCallout
            isOpen={activeInspector === 'stack'}
            placement="top-left"
            title="ZERO MARKUP"
            badge="$0 EGRESS"
            accentColor="bone"
            delay={0}
          >
            Eliminates per-GB proxy fees and third-party scraping subscription markups.
          </MarvelDialogueCallout>

          {/* Pop-Out Chip 2: Bottom-Right (Direct Pipeline) */}
          <MarvelDialogueCallout
            isOpen={activeInspector === 'stack'}
            placement="bottom-right"
            title="DIRECT DISPATCH"
            badge="S3 + PG"
            accentColor="signal"
            delay={0.08}
          >
            Normalized JSON streams directly into PostgreSQL &amp; object storage buckets.
          </MarvelDialogueCallout>

          <BentoCard
            tag="INFRASTRUCTURE COST"
            title="In-House Scraper vs Heavy Fleet"
            subtitle="Eliminate high per-GB charges and opaque proxy vendors."
            badge="FREEDOM"
            accentColor="bone"
            className="h-full min-h-[220px]"
          >
            <div className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t border-[var(--line-soft)] text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#0e0817] border border-[var(--line-soft)]">
                <div className="text-[var(--bone-muted)]">Old Model (Third-Party)</div>
                <div className="text-xl font-bold text-[var(--vermilion)] mt-1">$450 / mo</div>
                <div className="text-[10px] text-[var(--bone-muted)] mt-1">High per-GB, slow ticket resolution</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--signal)]/10 border border-[var(--signal)]/30">
                <div className="text-[var(--signal)] font-bold">Spider-Sense Architecture</div>
                <div className="text-xl font-bold text-[var(--bone)] mt-1">Own Your Stack</div>
                <div className="text-[10px] text-[var(--bone-muted)] mt-1">Direct Chromium runtime, AI-powered</div>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
