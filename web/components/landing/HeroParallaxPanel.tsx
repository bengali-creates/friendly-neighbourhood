'use client';

import React, { useRef, useEffect, useState } from 'react';
import { gsap } from '@/lib/gsap';

export function HeroParallaxPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null); // deepest: background telemetry grid
  const layer2Ref = useRef<HTMLDivElement>(null); // main code/intel diff card
  const layer3Ref = useRef<HTMLDivElement>(null); // active threat pill
  const layer4Ref = useRef<HTMLDivElement>(null); // floating reticle / ping

  // Hidden Pop-out cards state & refs
  const [activeSubTab, setActiveSubTab] = useState<'innovation' | 'fleet'>('innovation');
  const [isHovered, setIsHovered] = useState(false);
  const popCard1Ref = useRef<HTMLDivElement>(null);
  const popCard2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);

      // Layer 1: slowest (0.04 factor -> ~6px)
      if (layer1Ref.current) {
        gsap.to(layer1Ref.current, {
          x: x * 6,
          y: y * 4,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
      // Layer 2: primary card (0.08 factor -> ~12px)
      if (layer2Ref.current) {
        gsap.to(layer2Ref.current, {
          x: x * 12,
          y: y * 8,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
      // Layer 3: threat pill badge (0.12 factor -> ~18px)
      if (layer3Ref.current) {
        gsap.to(layer3Ref.current, {
          x: x * 18,
          y: y * 12,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
      // Layer 4: foreground reticle (0.16 factor -> ~24px)
      if (layer4Ref.current) {
        gsap.to(layer4Ref.current, {
          x: x * 24,
          y: y * 16,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }

      // Pop-out card parallax reaction when visible
      if (popCard1Ref.current) {
        gsap.to(popCard1Ref.current, {
          x: x * 15,
          y: y * 10,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
      if (popCard2Ref.current) {
        gsap.to(popCard2Ref.current, {
          x: x * -12,
          y: y * -8,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Hover pop-out spring animation
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (popCard1Ref.current) {
      gsap.to(popCard1Ref.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        pointerEvents: 'auto',
        duration: 0.45,
        ease: 'back.out(1.5)',
      });
    }
    if (popCard2Ref.current) {
      gsap.to(popCard2Ref.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        pointerEvents: 'auto',
        duration: 0.5,
        delay: 0.06,
        ease: 'back.out(1.4)',
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (popCard1Ref.current) {
      gsap.to(popCard1Ref.current, {
        opacity: 0,
        y: 16,
        scale: 0.94,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
      });
    }
    if (popCard2Ref.current) {
      gsap.to(popCard2Ref.current, {
        opacity: 0,
        y: 16,
        scale: 0.94,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative z-40 w-full max-w-125 xl:max-w-130 aspect-4/3 flex items-center justify-center select-none group cursor-crosshair"
    >
      {/* LAYER 1: Deep Backing Cyber Radiance (z: 10, delta ~6px) */}
      <div
        ref={layer1Ref}
        className="absolute inset-0 rounded-2xl border border-[var(--line-soft)] bg-gradient-to-br from-[#0e0a1b]/95 via-[#07050e]/98 to-[#12070c]/95 backdrop-blur-2xl shadow-2xl pointer-events-none transition-all duration-500 group-hover:border-[var(--signal)]/30"
        style={{
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.95), 0 0 50px rgba(0, 229, 255, 0.08)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(0,229,255,0.12),transparent_50%)]" />
        <div className="absolute top-4 left-5 flex items-center gap-2 text-[10px] font-mono text-[var(--signal)]/70 tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] animate-ping" />
          AUTONOMOUS SPIDER-SENSE // ACTIVE DISPATCH
        </div>
      </div>

      {/* LAYER 2: Primary Diff / Threat Log Panel (z: 30, delta ~12px) */}
      <div
        ref={layer2Ref}
        className="relative z-30 w-[94%] rounded-xl border border-[var(--line-strong)] bg-[#0d0916]/98 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 group-hover:shadow-[0_25px_60px_rgba(0,229,255,0.15)] group-hover:border-[var(--signal)]/50"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line-soft)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--vermilion)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--ember)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--signal)]" />
            <span className="ml-2 text-[11px] font-mono text-[var(--bone)] font-medium tracking-wider">
              defense_vector_inspect.log
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[var(--signal)] bg-[var(--signal)]/10 px-2 py-0.5 rounded border border-[var(--signal)]/30 font-semibold">
              AI-POWERED
            </span>
            <span className="text-[9px] font-mono text-[var(--bone-muted)] animate-pulse hidden sm:inline">
              [HOVER FOR INTEL]
            </span>
          </div>
        </div>

        {/* Code / Intelligence Stream */}
        <div className="space-y-2.5 text-[11px] font-mono leading-relaxed">
          <div className="text-[var(--bone-muted)] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-[var(--signal)] font-bold">&gt;</span>
              <span>TARGET AST:</span>
              <span className="text-[var(--bone)]">spotify.com/legal/terms</span>
            </span>
            <span className="text-[9px] text-[var(--signal)]/60">SHA-256: 9f8a...2e41</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--vermilion)]/10 border border-[var(--vermilion)]/30 text-[var(--bone)] text-[10.5px]">
            <span className="text-[var(--vermilion)] font-bold">[DISPUTE CLAUSE MODIFIED]</span>{' '}
            &ldquo;Users waive all rights to trial by jury and agree to informal dispute resolution exclusively.&rdquo;
          </div>

          <div className="p-2 rounded bg-[var(--signal)]/10 border border-[var(--signal)]/30 text-[var(--signal)] text-[10px] flex items-start gap-2">
            <span className="font-bold shrink-0">➔ VERDICT:</span>
            <span>Silent rights forfeiture detected. Individual arbitration opt-out revoked. Severity 4/5.</span>
          </div>

          <div className="flex items-center justify-between text-[9px] text-[var(--bone-muted)] pt-2 border-t border-[var(--line-soft)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              IN-HOUSE CHROMIUM RUNTIME
            </span>
            <span className="text-[var(--signal)] font-bold">LATENCY: 14ms</span>
          </div>
        </div>
      </div>

      {/* LAYER 3: Floating Critical Threat Pill (z: 35) - Mathematically aligned within parent boundary */}
      <div
        ref={layer3Ref}
        className="absolute bottom-2 left-4 z-35 px-3.5 py-2 rounded-xl border border-[var(--vermilion)]/60 bg-[#170609]/98 shadow-[0_10px_35px_rgba(224,35,28,0.4)] backdrop-blur-xl flex items-center gap-2.5 pointer-events-none"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--vermilion)] animate-pulse flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-white" />
        </div>
        <div>
          <div className="text-[10px] font-mono font-bold text-[var(--vermilion)] uppercase tracking-wider">
            Trap Neutralized
          </div>
          <div className="text-[8.5px] font-mono text-[var(--bone-muted)]">
            Zero-Width Honeypot Bypassed
          </div>
        </div>
      </div>

      {/* LAYER 4: Foreground Holographic Reticle (z: 35) - Mathematically aligned within parent boundary */}
      <div
        ref={layer4Ref}
        className="absolute top-2 right-4 z-35 p-2.5 rounded-xl border border-[var(--signal)]/50 bg-[#051119]/95 shadow-[0_10px_35px_rgba(0,229,255,0.3)] backdrop-blur-xl pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="absolute inset-0 border border-[var(--signal)] rounded-full animate-spin [animation-duration:6s]" />
            <div className="w-1 h-1 bg-[var(--signal)] rounded-full" />
          </div>
          <div className="text-right">
            <div className="text-[11px] font-mono font-bold text-[var(--signal)] leading-none">
              42ms
            </div>
            <div className="text-[7.5px] font-mono text-[var(--bone-muted)] uppercase tracking-wider mt-0.5">
              Cycle
            </div>
          </div>
        </div>
      </div>

      {/* POP-OUT CARD 1: Innovation Detail Window (Sits safely above the card within viewport) */}
      <div
        ref={popCard1Ref}
        className="absolute -top-30 max-w-90 -left-10 z-50 rounded-xl border border-[var(--signal)]/70 bg-[#070e17]/98 p-3.5 shadow-[0_20px_50px_rgba(0,229,255,0.35)] backdrop-blur-2xl opacity-0 translate-y-4 scale-95 pointer-events-none transition-shadow"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--line-soft)] mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-ping" />
            <span className="text-[9.5px] font-mono font-bold text-[var(--signal)] uppercase tracking-wider">
              WHAT WE ARE SOLVING // INNOVATION
            </span>
          </div>
          <span className="text-[8.5px] font-mono text-[var(--bone-muted)]">SYSTEM V3</span>
        </div>
        <p className="text-[10.5px] text-[var(--bone)] leading-relaxed font-sans">
          <span className="font-semibold text-white">Traditional scrapers choke on DOM mutation.</span> Spider-Sense parses layout geometry rather than fragile CSS selectors, self-healing code in flight with real-time AI inference.
        </p>
        <div className="mt-2 flex items-center justify-between text-[8.5px] font-mono text-[var(--signal)] bg-[var(--signal)]/10 px-2 py-0.5 rounded">
          <span>ZERO REGEX BREAKAGE</span>
          <span>AUTONOMOUS RESTORATION</span>
        </div>
      </div>

      {/* POP-OUT CARD 2: Architecture Spec Sheet (Sits safely at bottom-center of card without clipping right edge) */}
      <div
        ref={popCard2Ref}
        className="absolute -bottom-20 -right-10 w-60 z-50 rounded-xl border border-[var(--vermilion)]/60 bg-[#12060b]/98 p-3 shadow-[0_20px_50px_rgba(224,35,28,0.4)] backdrop-blur-2xl opacity-0 translate-y-4 scale-95 pointer-events-none"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--line-soft)] mb-1.5">
          <span className="text-[9.5px] font-mono font-bold text-[var(--vermilion)] uppercase tracking-wider">
            FLEET TELEMETRY SPECIFICATIONS
          </span>
          <span className="text-[8.5px] font-mono text-emerald-400">100% HEALTH</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-center">
          <div className="p-1 rounded bg-black/40">
            <span className="text-[var(--bone-muted)] block">ASN Shield</span>
            <span className="text-[var(--bone)] font-semibold">Direct Residential</span>
          </div>
          <div className="p-1 rounded bg-black/40">
            <span className="text-[var(--bone-muted)] block">Fingerprint</span>
            <span className="text-[var(--signal)] font-semibold">Human Jitter</span>
          </div>
          <div className="p-1 rounded bg-black/40">
            <span className="text-[var(--bone-muted)] block">Lock-In</span>
            <span className="text-[var(--vermilion)] font-bold">ZERO VENDOR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
