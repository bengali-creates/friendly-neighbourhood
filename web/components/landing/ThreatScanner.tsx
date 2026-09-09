'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/gsap';
import { Cpu, ArrowRight, Zap, RefreshCw, Terminal, CheckCircle2, Search, XCircle } from 'lucide-react';

interface StoryPhase {
  id: string;
  stepNum: string;
  badge: string;
  title: string;
  subtitle: string;
  status: 'failed' | 'active' | 'healing' | 'delivered';
  terminalLog: string;
  metric: string;
  metricLabel: string;
  description: string;
  technicalDetail: string;
}

const STORY_PHASES: StoryPhase[] = [
  {
    id: 'failure',
    stepNum: '01',
    badge: 'LEGACY SCRAPER FAILED',
    title: 'Honeypot Trap & 403 Ban',
    subtitle: 'Traditional scraper hits invisible trap link & gets banned immediately',
    status: 'failed',
    terminalLog: '[FATAL] Target returned HTTP 403 Forbidden. Trapped in <a href="/_sink_trap" opacity: 0.0001>. Scraper cluster banned.',
    metric: '100% BLOCKED',
    metricLabel: 'Standard Scraper Status',
    description: 'Conventional regex and static headful scrapers execute traps blindly. Target anti-bot suites poison DOM coordinates with invisible sinks, ban IP pools, and terminate data pipelines.',
    technicalDetail: 'Sink element: 0x0 DOM coordinate listener with prototype taint monitoring.',
  },
  {
    id: 'activated',
    stepNum: '02',
    badge: 'SPIDER-SENSE ACTIVATED',
    title: 'Autonomous Headless Recon',
    subtitle: 'Spider-Sense detects defensive perimeter and computes detour path',
    status: 'active',
    terminalLog: '[SPIDER-SENSE] Perimeter anomaly flagged. Searching query parameters. Dynamic curly route calculated around honeypot.',
    metric: '4.2ms',
    metricLabel: 'Perimeter Response Time',
    description: 'Spider-Sense AI wakes up instantaneously upon detecting defense telemetry. Rather than driving blindly into trap coordinates, it dynamically computes an evasive vector route around the sink.',
    technicalDetail: 'V8 headless context initialized with real human mouse jitter vectors & authentic event dispatch timestamps.',
  },
  {
    id: 'healing',
    stepNum: '03',
    badge: 'AUTOMATIC HEALING',
    title: 'In-Memory AST Tree Mutation',
    subtitle: 'AI excises trap nodes & synthesizes selectors around obfuscated hashes',
    status: 'healing',
    terminalLog: '[AUTO-HEAL] CSS class hashes rotated (e.g. ._7x9q -> ._2m1z). Semantic layout graph rebuilt. Excising invisible sink nodes.',
    metric: '99.8%',
    metricLabel: 'Autonomous Healing Rate',
    description: 'When targets rotate CSS class hashes or inject fake canvas tests, our self-healing engine reconstructs the semantic hierarchy in-memory before navigation evaluation, without writing broken code.',
    technicalDetail: 'Hierarchical node clustering binds target price/stock data using spatial relations instead of fragile class names.',
  },
  {
    id: 'delivered',
    stepNum: '04',
    badge: 'CLEAN PAYLOAD DELIVERED',
    title: 'Verified Pipeline Dispatch',
    subtitle: 'Normalized, high-fidelity JSON streamed directly to your database',
    status: 'delivered',
    terminalLog: '[DISPATCH] Payload verified. Schema intact. 0 errors, 14ms latency. Dispatched to customer webhook and civic monitor.',
    metric: '14ms',
    metricLabel: 'End-to-End Latency',
    description: 'Clean, structured intelligence delivered with zero manual intervention. The pipeline flows continuously without developer paging or broken cron jobs.',
    technicalDetail: 'Strict schema validation against target interface; delta changes diffed against historical snapshot database.',
  },
];

export function ThreatScanner() {
  const containerRef = useRef<HTMLElement>(null);
  const diffBoxRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const curlyArrowRef = useRef<SVGPathElement>(null);
  const curlyArrowGlowRef = useRef<SVGPathElement>(null);
  const trapPathRef = useRef<SVGPathElement>(null);
  const paperLeftRef = useRef<HTMLDivElement>(null);
  const redactStripsRef = useRef<HTMLDivElement>(null);

  // Active story step: 0 to 3
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Fluid progressive scrub timeline (NO HARD PINNING TO AVOID SCROLL JITTER/LAG)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top 75%',
          end: 'bottom 25%',
          scrub: 1, // Smooth dampening without hijacking window scroll
          onUpdate: (self) => {
            // Smoothly maps scroll progression (0.0 to 1.0) into the 4 story phases
            const progress = self.progress;
            const newIndex = Math.min(Math.floor(progress * 4), 3);
            setActiveStep(newIndex);
          },
        },
      });

      // 1. Scanner beam sweep descending through container
      if (scanLineRef.current) {
        tl.fromTo(
          scanLineRef.current,
          { top: '0%', opacity: 0.2 },
          { top: '100%', opacity: 1, ease: 'none', duration: 1 },
          0
        );
      }

      // 2. Workbench subtle entrance and glow scrub
      if (diffBoxRef.current) {
        tl.fromTo(
          diffBoxRef.current,
          { y: 30, opacity: 0.85 },
          { y: 0, opacity: 1, ease: 'power2.out', duration: 0.6 },
          0
        );
      }

      // 3. Dynamic curly arrows draw-in animation
      if (curlyArrowRef.current && curlyArrowGlowRef.current) {
        const pathLength = curlyArrowRef.current.getTotalLength?.() || 600;
        gsap.set([curlyArrowRef.current, curlyArrowGlowRef.current], {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        tl.to(
          [curlyArrowRef.current, curlyArrowGlowRef.current],
          {
            strokeDashoffset: 0,
            ease: 'power1.inOut',
            duration: 0.8,
          },
          0.1
        );
      }

      // 4. Trap straight path pulse
      if (trapPathRef.current) {
        const trapLength = trapPathRef.current.getTotalLength?.() || 400;
        gsap.set(trapPathRef.current, {
          strokeDasharray: trapLength,
          strokeDashoffset: trapLength,
        });

        tl.to(
          trapPathRef.current,
          {
            strokeDashoffset: 0,
            ease: 'power1.out',
            duration: 0.4,
          },
          0
        );
      }
    }, container);

    return () => ctx.revert();
  }, []);

  const currentPhase = STORY_PHASES[activeStep];

  return (
    <section
      ref={containerRef}
      id="scanner"
      className="relative min-h-screen flex flex-col items-center justify-center py-20 sm:py-28 px-6 sm:px-10 overflow-hidden"
    >
      {/* Chapter Scrim (z: -1): Dark vermilion to deep obsidian warning wash */}
      <div
        className="pointer-events-none absolute inset-[-20%_-5%] z-[-1]"
        style={{
          background:
            'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(224, 35, 28, 0.08), rgba(8, 6, 13, 0.95) 80%)',
        }}
        aria-hidden="true"
      />

      {/* Background Classified Paper Artifacts (z: 0 - Placed strictly behind the cards) */}
      <div
        className="pointer-events-none absolute left-3 bottom-12 z-0 w-[160px] sm:w-[220px] select-none mix-blend-screen hidden xl:block opacity-40"
        aria-hidden="true"
      >
        <Image
          src="/assets/threat-paper-left.jpg"
          alt="Classified intel fragment"
          width={400}
          height={400}
          className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
        />
      </div>

      <div
        className="pointer-events-none absolute right-4 top-16 z-0 w-[200px] sm:w-[260px] select-none mix-blend-screen hidden xl:block opacity-45"
        aria-hidden="true"
      >
        <Image
          src="/assets/threat-redact-strips.jpg"
          alt="Classified redaction bars"
          width={500}
          height={280}
          className="w-full h-auto drop-shadow-[0_0_30px_rgba(224,35,28,0.4)]"
        />
      </div>

      {/* CHAPTER HEADER */}
      <div className="relative z-20 max-w-4xl mx-auto text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--vermilion)]/40 bg-[var(--vermilion)]/10 mb-3">
          <span className="w-2 h-2 rounded-full bg-[var(--vermilion)] animate-ping" />
          <span className="text-[10px] font-mono tracking-widest text-[var(--vermilion)] uppercase font-semibold">
            ACT II // STORYTELLING NARRATIVE
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--bone)]">
          From Threat Encounter to <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--vermilion)] via-[var(--ember)] to-[var(--signal)]">
            Flawless Delivery: The Live Journey
          </span>
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-[var(--bone-muted)] max-w-2xl mx-auto font-light leading-relaxed">
          Scroll through to follow the exact journey. See how standard scrapers collapse, how Spider-Sense activates, routes around honeypots with curly path detours, and auto-heals before delivery.
        </p>
      </div>

      {/* STORY PHASE STEPPER NAVIGATION (Clickable & Scroll-Linked) */}
      <div className="relative z-30 w-full max-w-5xl mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 font-mono">
          {STORY_PHASES.map((phase, idx) => {
            const isCurrent = activeStep === idx;
            const isPassed = activeStep > idx;

            return (
              <button
                key={phase.id}
                onClick={() => setActiveStep(idx)}
                className={`relative p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-300 group ${
                  isCurrent
                    ? 'border-[var(--signal)] bg-[#101426] shadow-[0_0_25px_rgba(0,229,255,0.22)] scale-[1.02]'
                    : isPassed
                    ? 'border-[var(--line-strong)] bg-[#0d0a17]/90 text-[var(--bone-muted)] hover:border-[var(--signal)]/50'
                    : 'border-[var(--line-soft)] bg-[#090710]/80 text-[var(--bone-muted)]/60 hover:border-[var(--line)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-bold tracking-wider ${
                      isCurrent
                        ? 'text-[var(--signal)]'
                        : isPassed
                        ? 'text-[var(--bone-dim)]'
                        : 'text-[var(--muted)]'
                    }`}
                  >
                    PHASE {phase.stepNum}
                  </span>
                  {phase.status === 'failed' && (
                    <XCircle className="w-3.5 h-3.5 text-[var(--vermilion)]" />
                  )}
                  {phase.status === 'active' && (
                    <Search className="w-3.5 h-3.5 text-[var(--signal)] animate-spin" />
                  )}
                  {phase.status === 'healing' && (
                    <RefreshCw className="w-3.5 h-3.5 text-[var(--ember)] animate-pulse" />
                  )}
                  {phase.status === 'delivered' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--emerald)]" />
                  )}
                </div>

                <div
                  className={`text-xs sm:text-sm font-sans font-bold leading-tight line-clamp-1 ${
                    isCurrent ? 'text-[var(--bone)]' : 'text-[var(--bone-dim)]'
                  }`}
                >
                  {phase.title}
                </div>

                {/* Progress underline bar */}
                <div className="mt-2 w-full h-1 rounded-full bg-[#1c182c] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCurrent
                        ? 'w-full bg-gradient-to-r from-[var(--signal)] to-[var(--ember)]'
                        : isPassed
                        ? 'w-full bg-[var(--line-strong)]'
                        : 'w-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE WORKBENCH: THE STORY ENGINE (Zero Lag, Rich Graphics) */}
      <div
        ref={diffBoxRef}
        className="relative z-30 w-full max-w-5xl rounded-2xl border border-[var(--line-strong)] bg-[#0c0818]/98 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.92)] p-5 sm:p-7 overflow-hidden transition-all duration-300"
      >
        {/* Laser Sweep Scan-Line */}
        <div
          ref={scanLineRef}
          className="pointer-events-none absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--signal)] to-transparent z-40 shadow-[0_0_15px_#00E5FF,0_0_30px_#00E5FF]"
        />

        {/* TOP STATUS BAR */}
        <div className="flex flex-wrap items-center justify-between pb-3.5 mb-5 border-b border-[var(--line-soft)] font-mono text-xs gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--signal)] animate-pulse" />
            <span className="text-[var(--bone)] font-semibold">STORYLINE MONITOR:</span>
            <span className="text-[var(--signal)] font-bold">{currentPhase.badge}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[var(--bone-muted)] text-[11px]">AUTONOMOUS DEFENSE MESH</span>
            <span className="bg-[#1b152d] border border-[var(--line-soft)] px-2.5 py-0.5 rounded text-[10px] text-[var(--bone-dim)]">
              STAGE 0{activeStep + 1} OF 04
            </span>
          </div>
        </div>

        {/* MAIN SPLIT: VISUAL CURLY ROUTING DIAGRAM VS TELEMETRY & INTEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* LEFT 7 COLS: THE CURLY ROUTING & TRAP DIAGRAM */}
          <div className="lg:col-span-7 bg-[#080511] border border-[var(--line-soft)] rounded-xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
            {/* Ambient Diagram Background Grid */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#00E5FF 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Diagram Header */}
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--bone-muted)] mb-2 z-10">
              <span className="flex items-center gap-1.5 text-[var(--signal)]">
                <Cpu className="w-3.5 h-3.5" /> DYNAMIC ROUTE DETOUR VISUALIZER
              </span>
              <span className="text-[var(--bone-dim)]">LIVE TOPOLOGY</span>
            </div>

            {/* SVG VECTOR CANVAS WITH ANIMATED CURLY ARROWS */}
            <div className="relative w-full h-[220px] flex items-center justify-center my-2 z-10">
              <svg
                viewBox="0 0 540 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <defs>
                  {/* Neon Glow Filters */}
                  <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Arrow Markers */}
                  <marker
                    id="arrow-cyan"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#00E5FF" />
                  </marker>

                  <marker
                    id="arrow-red"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#E0231C" />
                  </marker>
                </defs>

                {/* 1. ORIGIN NODE: Scraper Client */}
                <g transform="translate(25, 110)">
                  <circle r="16" fill="#0f0b1e" stroke="#00E5FF" strokeWidth="1.5" />
                  <circle r="6" fill="#00E5FF" className="animate-pulse" />
                  <text x="0" y="32" fill="#DFE7E0" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    QUERY ORIGIN
                  </text>
                  <text x="0" y="44" fill="rgba(223,231,224,0.5)" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    [GET /catalog]
                  </text>
                </g>

                {/* 2. THE BLOCKED PATH: Straight line into HoneyPot (Failed Legacy Scraper) */}
                <path
                  ref={trapPathRef}
                  d="M 45 110 L 260 110"
                  stroke="#E0231C"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  markerEnd="url(#arrow-red)"
                  opacity={activeStep === 0 ? 1 : 0.4}
                  className="transition-all duration-300"
                />

                {/* HONEYPOT TRAP NODE (In Center) */}
                <g transform="translate(270, 110)">
                  <rect
                    x="-40"
                    y="-28"
                    width="80"
                    height="56"
                    rx="8"
                    fill="#1b080c"
                    stroke="#E0231C"
                    strokeWidth={activeStep === 0 ? "2" : "1.2"}
                    filter={activeStep === 0 ? "url(#red-glow)" : undefined}
                    className="transition-all duration-300"
                  />
                  <text x="0" y="-8" fill="#E0231C" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    HONEYPOT SINK
                  </text>
                  <text x="0" y="8" fill="#DFE7E0" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    opacity: 0.0001
                  </text>
                  <text x="0" y="20" fill="#E0231C" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    [403 FORBIDDEN]
                  </text>
                </g>

                {/* 3. THE CURLY CURLY DETOUR ARROW: Spider-Sense Autonomous Bypass */}
                {/* Underglow Path */}
                <path
                  ref={curlyArrowGlowRef}
                  d="M 45 110 C 110 30, 150 18, 270 20 C 380 22, 420 80, 480 110"
                  stroke="#00E5FF"
                  strokeWidth="4"
                  fill="none"
                  opacity={activeStep >= 1 ? 0.35 : 0.05}
                  filter="url(#cyan-glow)"
                  className="transition-all duration-500"
                />

                {/* Main Dynamic Curly Path */}
                <path
                  ref={curlyArrowRef}
                  d="M 45 110 C 110 30, 150 18, 270 20 C 380 22, 420 80, 480 110"
                  stroke={activeStep >= 1 ? "#00E5FF" : "rgba(0, 229, 255, 0.2)"}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  markerEnd="url(#arrow-cyan)"
                  className="transition-all duration-500"
                />

                {/* Decorative Curly Loop-the-loop Node representing in-flight AST Auto-healing */}
                <g transform="translate(270, 20)">
                  <circle
                    r="12"
                    fill="#07131d"
                    stroke="#00E5FF"
                    strokeWidth="1.5"
                    filter={activeStep >= 2 ? "url(#cyan-glow)" : undefined}
                  />
                  <circle r="4" fill="#FF6B2B" className={activeStep >= 2 ? "animate-ping" : ""} />
                  <text x="0" y="-18" fill="#00E5FF" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    AST AUTO-HEAL
                  </text>
                  <text x="0" y="-8" fill="rgba(223,231,224,0.6)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                    Dynamic Detour
                  </text>
                </g>

                {/* 4. DESTINATION NODE: Verified Delivery Target */}
                <g transform="translate(495, 110)">
                  <circle
                    r="16"
                    fill="#091815"
                    stroke={activeStep === 3 ? "#10B981" : "#00E5FF"}
                    strokeWidth="1.8"
                    className="transition-all duration-300"
                  />
                  <circle
                    r="6"
                    fill={activeStep === 3 ? "#10B981" : "#00E5FF"}
                    className={activeStep === 3 ? "animate-pulse" : ""}
                  />
                  <text x="0" y="32" fill="#DFE7E0" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    CLEAN PAYLOAD
                  </text>
                  <text x="0" y="44" fill={activeStep === 3 ? "#10B981" : "rgba(223,231,224,0.5)"} fontSize="8" fontFamily="monospace" textAnchor="middle">
                    {activeStep === 3 ? "200 OK // DELIVERED" : "VERIFYING..."}
                  </text>
                </g>
              </svg>
            </div>

            {/* Bottom Caption on Routing Diagram */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--line-soft)] text-[10px] font-mono">
              <div className="flex items-center gap-2 text-[var(--vermilion)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--vermilion)]" />
                <span>Legacy Route: Trap Hit & IP Blocked</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--signal)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)]" />
                <span>Spider-Sense Route: Curly Detour & Delivered</span>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: DYNAMIC STORY TELEMETRY & TERMINAL */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* Live Metric Showcase */}
            <div className="p-4 rounded-xl border border-[var(--line-soft)] bg-[#0f0b1e]/90 backdrop-blur-md">
              <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-[var(--bone-muted)]">
                <span>STAGE KPI TELEMETRY</span>
                <span className="text-[var(--signal)]">REAL-TIME</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className={`text-2xl sm:text-3xl font-bold font-mono ${
                  currentPhase.status === 'failed' ? 'text-[var(--vermilion)]' : 'text-[var(--signal)]'
                }`}>
                  {currentPhase.metric}
                </span>
                <span className="text-xs font-mono text-[var(--bone-dim)]">
                  {currentPhase.metricLabel}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--bone-muted)] leading-relaxed font-sans">
                {currentPhase.description}
              </p>
            </div>

            {/* Live Terminal Log Stream */}
            <div className="p-3.5 rounded-xl border border-[var(--line-strong)] bg-[#06040c] font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line-soft)] text-[10px] text-[var(--bone-muted)]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-[var(--signal)]" />
                  <span>V8 RUNTIME JOURNAL</span>
                </div>
                <span className="text-[var(--ember)] animate-pulse">● STREAMING</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div className="text-[var(--muted)]">[00:04:12.802] INGEST PIPELINE INITIATED</div>
                <div className={`${
                  currentPhase.status === 'failed'
                    ? 'text-[var(--vermilion)] bg-[var(--vermilion)]/10 p-1.5 rounded'
                    : 'text-[var(--signal)] bg-[#071724] p-1.5 rounded'
                }`}>
                  {currentPhase.terminalLog}
                </div>
                <div className="text-[var(--bone-muted)] text-[10px] pt-1">
                  SPEC: {currentPhase.technicalDetail}
                </div>
              </div>
            </div>

            {/* Narrative Progression Prompt */}
            <div className="p-3 rounded-xl border border-[var(--signal)]/30 bg-[#07131e]/70 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--signal)]" />
                <span className="text-[var(--bone)]">
                  {activeStep === 3 ? 'Full Story Complete' : 'Scroll down or click steps above to advance'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--signal)] animate-pulse" />
            </div>

          </div>
        </div>

        {/* BOTTOM TELEMETRY FOOTER */}
        <div className="mt-6 pt-3.5 border-t border-[var(--line-soft)] flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--bone-muted)] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-ping" />
            <span>Smooth progressive scrub: Story evolves fluidly as you scroll without browser lag</span>
          </div>
          <div className="text-[var(--signal)] font-semibold">
            ENGINE: PLAYWRIGHT + IN-MEMORY AST HEALING // NO THIRD-PARTY DEPENDENCY
          </div>
        </div>
      </div>
    </section>
  );
}
