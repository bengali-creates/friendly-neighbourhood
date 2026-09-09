'use client';

import React, { useRef, useEffect, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { MarvelDialogueCallout } from './MarvelDialogueCallout';
import { CircuitTraceLeft, CircuitTraceRight } from './foreground/CircuitTraces';

interface Step {
  num: string;
  phase: string;
  title: string;
  detail: string;
  telemetry: string;
  deepIntel: {
    innovation: string;
    engineSpec: string;
    advantage: string;
  };
}

const STEPS: Step[] = [
  {
    num: '01',
    phase: 'INGEST & RECON',
    title: 'Dynamic Fingerprint Emulation',
    detail:
      'Spawns headless Chromium clusters with synthesized human micro-jitters, randomized canvas hashes, and residential ASN routing with zero proxy footprint.',
    telemetry: 'LATENCY: 8ms // CLOUD: ASYNC',
    deepIntel: {
      innovation: 'Direct CDP Kernel Injection',
      engineSpec: 'Chromium 128 V8 runtime with patched WebGL vendor and audio jitter primitives.',
      advantage: '100% bypass of Cloudflare Turnstile and DataDome without paying third-party CAPTCHA solving farms.',
    },
  },
  {
    num: '02',
    phase: 'INSPECTION & DIFF',
    title: 'Autonomous DOM Poison Inspection',
    detail:
      'AI models evaluate the incoming HTML layout structure against historical AST snapshots to immediately flag honeypots, zero-width spans, and bot traps.',
    telemetry: 'ACCURACY: 99.8% // TIME: 12ms',
    deepIntel: {
      innovation: 'Structural AST Differencing',
      engineSpec: 'Tree comparison algorithm flags DOM injections and hidden trap hyperlinks before browser execution.',
      advantage: 'Eliminates crawler IP blacklisting caused by inadvertent honeypot link triggering.',
    },
  },
  {
    num: '03',
    phase: 'SYNTHESIS & RESOLUTION',
    title: 'Semantic Vector Extraction',
    detail:
      'Translates fragile CSS selectors into enduring semantic coordinate queries. When target page layouts redesign overnight, scrapers adapt without human intervention.',
    telemetry: 'DRIFT_TOLERANCE: HIGH // ZERO_BREAK',
    deepIntel: {
      innovation: 'Visual Geometry Embeddings',
      engineSpec: 'Extracts data based on relative spatial hierarchy and visual bounding boxes rather than volatile class names.',
      advantage: 'Zero scraper maintenance engineering required when target e-commerce sites push front-end updates.',
    },
  },
  {
    num: '04',
    phase: 'EMISSION & STORAGE',
    title: 'Normalized Structured Delivery',
    detail:
      'Clean tabular records, vector embeddings, and validated JSON payloads stream directly to PostgreSQL, Snowflake, S3, or your internal webhooks.',
    telemetry: 'THROUGHPUT: 5,000 req/sec // SECURE',
    deepIntel: {
      innovation: 'Schema Validation Gateway',
      engineSpec: 'Real-time JSON schema enforcement with automatic coercion and semantic classification.',
      advantage: 'Downstream data warehouses receive 100% type-safe, deduplicated intelligence without pipeline crashes.',
    },
  },
];

export function PipelineSection() {
  const containerRef = useRef<HTMLElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const fgLeftRef = useRef<HTMLDivElement>(null);
  const fgRightRef = useRef<HTMLDivElement>(null);

  // Active selected row state for deep inspection popout
  const [activeStepIdx, setActiveStepIdx] = useState<number | null>(null);

  useEffect(() => {
    const rows = rowsRef.current;
    if (!rows) return;

    const ctx = gsap.context(() => {
      // Per-card progressive reveal triggered individually as each card enters view
      const items = rows.querySelectorAll('.les-row');
      items.forEach((item, index) => {
        // Alternating slide direction: even from left (-45px), odd from right (+45px)
        const fromX = index % 2 === 0 ? -45 : 45;

        gsap.fromTo(
          item,
          { opacity: 0, x: fromX, scale: 0.98 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%', // Triggers with a generous buffer before hitting viewport center
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Foreground circuit traces parallax
      if (fgLeftRef.current && fgRightRef.current) {
        gsap.fromTo(
          [fgLeftRef.current, fgRightRef.current],
          { opacity: 0, y: 40 },
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
      id="engine"
      className="relative min-h-screen flex flex-col justify-center py-24 sm:py-28 px-6 sm:px-10 overflow-hidden"
    >
      {/* Chapter Scrim (z: -1): Dark cyber cyan accent */}
      <div
        className="pointer-events-none absolute inset-[-20%_-5%] z-[-1]"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0, 229, 255, 0.05), rgba(8, 6, 13, 0.94) 85%)',
        }}
        aria-hidden="true"
      />

      {/* FOREGROUND CIRCUIT TRACES (z: 0 - Behind Cards) */}
      <div
        ref={fgLeftRef}
        className="pointer-events-none absolute left-0 top-1/4 z-0 w-[240px] sm:w-[320px] opacity-0 hidden lg:block"
        aria-hidden="true"
      >
        <CircuitTraceLeft />
      </div>
      <div
        ref={fgRightRef}
        className="pointer-events-none absolute right-0 bottom-12 z-0 w-[240px] sm:w-[320px] opacity-0 hidden lg:block"
        aria-hidden="true"
      >
        <CircuitTraceRight />
      </div>

      {/* SECTION HEADER */}
      <div className="relative z-20 max-w-4xl mx-auto text-left w-full mb-12 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--line-strong)] bg-[#0e0a1b]/90 mb-4">
          <span className="w-2 h-2 rounded-full bg-[var(--signal)]" />
          <span className="text-[11px] font-mono tracking-widest text-[var(--signal)] uppercase font-semibold">
            ACT III // THE EXTRACTION ARCHITECTURE
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--bone)] leading-tight">
          Engineered for zero-break web intelligence. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--signal)] to-[var(--bone)]">
            Every step self-heals in flight.
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[var(--bone-muted)] max-w-xl font-light leading-relaxed">
          Hover or click any pipeline phase below to pop out the architectural blueprint and kernel specifications.
        </p>
      </div>

      {/* LES CURRICULUM ROWS (z: 30 - Topmost Layer) */}
      <div ref={rowsRef} className="relative z-30 max-w-4xl mx-auto w-full space-y-4">
        {STEPS.map((step, idx) => {
          const isActive = activeStepIdx === idx;
          return (
            <div
              key={step.num}
              onMouseEnter={() => setActiveStepIdx(idx)}
              onMouseLeave={() => setActiveStepIdx(null)}
              onClick={() => setActiveStepIdx(isActive ? null : idx)}
              className={`les-row group relative rounded-2xl border transition-colors duration-200 backdrop-blur-xl cursor-pointer ${
                isActive
                  ? 'border-[var(--signal)] bg-[#140f28]/98 shadow-[0_15px_45px_rgba(0,229,255,0.18)]'
                  : 'border-[var(--line-soft)] hover:border-[var(--line-strong)] bg-[#0d0918]/90'
              }`}
            >
              {/* STABLE BASE CARD - Never changes height or position on hover */}
              <div className="p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <span className="text-xl sm:text-2xl font-mono font-light text-[var(--signal)] shrink-0">
                      {step.num}
                    </span>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--vermilion)] mb-1 font-semibold">
                        {step.phase}
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-[var(--bone)] group-hover:text-white transition-colors">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-[var(--bone-muted)] leading-relaxed max-w-xl">
                        {step.detail}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                    <span className="inline-block text-[10px] font-mono text-[var(--signal)] bg-[var(--signal)]/10 px-2.5 py-1 rounded border border-[var(--signal)]/30 font-semibold">
                      {step.telemetry}
                    </span>
                  </div>
                </div>
              </div>

              {/* MULTIPLE SMALL MARVEL POP-OUT CHIPS (Zero window bleed, snappy 3D pop) */}
              {/* Chip 1: Innovation (Top-Left) */}
              <MarvelDialogueCallout
                isOpen={isActive}
                placement="top-left"
                title="INNOVATION"
                badge={step.num}
                accentColor="signal"
                delay={0}
              >
                {step.deepIntel.innovation}
              </MarvelDialogueCallout>

              {/* Chip 2: Specification & Measurable Value (Top-Right) */}
              <MarvelDialogueCallout
                isOpen={isActive}
                placement="top-right"
                title="ENGINE SPEC"
                badge="100% OK"
                accentColor="ember"
                delay={0.07}
              >
                <div className="space-y-1">
                  <div>{step.deepIntel.engineSpec}</div>
                  <div className="pt-1 border-t border-[var(--line-soft)] text-emerald-400 font-semibold text-[9.5px]">
                    ➔ {step.deepIntel.advantage}
                  </div>
                </div>
              </MarvelDialogueCallout>
            </div>
          );
        })}
      </div>
    </section>
  );
}
