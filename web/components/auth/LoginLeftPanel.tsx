'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { SpideySenseCenterpiece } from './SpideySenseCenterpiece';
import { Zap, ShieldCheck } from 'lucide-react';

interface LoginLeftPanelProps {
  typingIntensity?: number;
}

export function LoginLeftPanel({ typingIntensity = 0 }: LoginLeftPanelProps) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // Badge entrance
    tl.fromTo(
      badgeRef.current,
      { y: -15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      0.2
    );

    // Headline reveal
    tl.fromTo(
      headlineRef.current,
      { y: 25, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      0.4
    );

    // Subtitle reveal
    tl.fromTo(
      subRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6 },
      '-=0.3'
    );

    // HUD metrics reveal
    tl.fromTo(
      hudRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.7 },
      '-=0.2'
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-between h-full w-full overflow-hidden px-6 py-5 select-none">
      {/* Background ambient radial aura */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 95% 75% at 50% 45%, rgba(0,229,255,0.08) 0%, rgba(224,35,28,0.03) 45%, rgba(8,6,13,0) 75%)',
        }}
      />

      {/* Top Section: Clear, dramatic, single-purpose narrative */}
      <div className="text-center z-10 max-w-[400px] mt-2">
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--signal)]/30 bg-[#00E5FF]/5 mb-2 opacity-0"
        >
          <Zap className="w-3 h-3 text-[#00E5FF] animate-pulse" />
          <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#00E5FF] font-semibold">
            PRECOGNITIVE SENSORY SHIELD
          </span>
        </div>

        <h2
          ref={headlineRef}
          className="text-[clamp(22px,2.2vw,32px)] font-light tracking-tight text-[#DFE7E0] leading-tight mb-1.5 opacity-0"
          style={{ fontFamily: 'Onest, sans-serif' }}
        >
          The <span className="text-[#00E5FF] font-normal drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]">Sixth Sense</span> You Were Promised
        </h2>

        <p
          ref={subRef}
          className="text-[11px] xl:text-[12px] text-[rgba(223,231,224,0.6)] text-center leading-relaxed opacity-0"
        >
          An instinctive early-warning radar that feels danger in digital fine print, silent policy shifts, and quiet recalls before you agree.
        </p>
      </div>

      {/* Centerpiece: Massive Spider-Verse Holographic Spidey-Sense */}
      <div className="relative w-full flex items-center justify-center my-auto z-10">
        <SpideySenseCenterpiece typingIntensity={typingIntensity} />
      </div>

      {/* Bottom HUD: Clean, high-tech status readouts */}
      <div
        ref={hudRef}
        className="w-full max-w-[400px] rounded-xl border border-[rgba(223,231,224,0.08)] bg-[#0d0a18]/70 backdrop-blur-md px-4 py-2.5 flex items-center justify-between z-10 opacity-0 mb-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-[#DFE7E0] tracking-wide">
              RADAR // STANDBY
            </div>
            <div className="text-[9px] font-mono text-[rgba(223,231,224,0.4)] uppercase">
              Resonance active · 120Hz scan
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-mono text-[#00E5FF] tracking-widest font-semibold flex items-center gap-1.5 justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
            SYNCHRONIZED
          </div>
          <div className="text-[9px] font-mono text-[rgba(223,231,224,0.35)]">
            Zero latency warning
          </div>
        </div>
      </div>
    </div>
  );
}
