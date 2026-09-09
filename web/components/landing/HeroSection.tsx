'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { gsap } from '@/lib/gsap';
import { HeroParallaxPanel } from './HeroParallaxPanel';
import { HexGridLeft } from './foreground/HexGridLeft';
import { HexGridRight } from './foreground/HexGridRight';

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const fgLeftRef = useRef<HTMLDivElement>(null);
  const fgRightRef = useRef<HTMLDivElement>(null);

  // Typewriter subhead state for high-impact cyber typing
  const [typedText, setTypedText] = useState('');
  const fullSubhead = 'Spider-Sense AI continuously scans terms of service updates, safety registries, and civic feeds using autonomous Chromium collectors. You are never blindsided.';

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx <= fullSubhead.length) {
        setTypedText(fullSubhead.slice(0, currentIdx));
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Badge entrance
      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.6 }
        );
      }

      // Staggered headline lines reveal with 3D perspective
      if (headlineRef.current) {
        const lines = headlineRef.current.querySelectorAll('.hero-line');
        tl.fromTo(
          lines,
          { opacity: 0, y: 40, rotateX: 25 },
          { opacity: 1, y: 0, rotateX: 0, stagger: 0.12, duration: 0.85 },
          '-=0.3'
        );
      }

      // CTA group slide
      if (ctaGroupRef.current) {
        tl.fromTo(
          ctaGroupRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.3'
        );
      }

      // Ambient foreground entrance (pushed down and out of main content flow)
      if (fgLeftRef.current && fgRightRef.current) {
        tl.fromTo(
          [fgLeftRef.current, fgRightRef.current],
          { opacity: 0, y: 30 },
          { opacity: 0.35, y: 0, duration: 1.2, stagger: 0.2 },
          '-=0.6'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-[95vh] flex items-center justify-center pt-28 pb-16 px-6 sm:px-10 overflow-hidden"
    >
      {/* Chapter Scrim (z: -1): Soft cyber glow without canvas obliteration */}
      <div
        className="pointer-events-none absolute inset-[-20%_-5%] z-[-1]"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(0, 229, 255, 0.05), rgba(8, 6, 13, 0.85) 75%)',
        }}
        aria-hidden="true"
      />

      {/* FOREGROUND ASSETS (z: 0) - Kept on extreme flanks so they never cross columns */}
      <div
        ref={fgLeftRef}
        className="pointer-events-none absolute left-0 bottom-0 z-0 w-[200px] lg:w-[280px] opacity-0 hidden xl:block"
        aria-hidden="true"
      >
        <HexGridLeft />
      </div>

      <div
        ref={fgRightRef}
        className="pointer-events-none absolute right-0 top-16 z-0 w-[200px] lg:w-[260px] opacity-0 hidden xl:block"
        aria-hidden="true"
      >
        <HexGridRight />
      </div>

      {/* MAIN TWO-COLUMN CONTENT (z: 30) */}
      <div className="relative z-30 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
        {/* Left Column: Narrative Headline & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-6 pr-0 lg:pr-4">
          {/* Chapter & Signal Badge */}
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[var(--line-strong)] bg-[#0f0b1a]/90 backdrop-blur-md shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[var(--bone)] uppercase font-medium">
              AUTONOMOUS SIGNAL ENGINE | IN-HOUSE SCRAPERS
            </span>
          </div>

          {/* Staggered Cinematic Headline */}
          <h1
            ref={headlineRef}
            className="text-4xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-[var(--bone)] leading-[1.08] [perspective:1000px]"
          >
            <span className="hero-line block">The signal in</span>
            <span className="hero-line block text-transparent bg-clip-text bg-gradient-to-r from-[var(--signal)] via-white to-[var(--bone)]">
              the noise.
            </span>
          </h1>

          {/* Typewriter Subhead */}
          <p className="text-base sm:text-lg text-[var(--bone-muted)] max-w-xl font-light leading-relaxed min-h-[4.5rem]">
            {typedText}
            <span className="inline-block w-2 h-4 ml-1 bg-[var(--vermilion)] animate-pulse align-middle" />
          </p>

          {/* Primary Action Group */}
          <div
            ref={ctaGroupRef}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Link
              href="/login?mode=signup"
              className="cta-slide group relative inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-medium text-sm text-[#08060D] bg-[var(--signal)] shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.7)] transition-all cursor-pointer"
            >
              <span className="relative z-10 font-mono font-semibold tracking-wider uppercase text-xs flex items-center gap-2">
                Enter Control Room
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>

            <a
              href="#threat-layer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[var(--line-soft)] hover:border-[var(--line-strong)] bg-[#120e20]/80 hover:bg-[#1a142e] text-[var(--bone)] text-xs font-mono uppercase tracking-wider backdrop-blur-md transition-all"
            >
              Inspect Threat Demo ↓
            </a>
          </div>

          {/* Bottom Quick-Chapter Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[var(--line-soft)] w-full max-w-2xl">
            <a href="#signal" className="p-2.5 rounded-lg border border-[var(--signal)]/30 bg-[#0c0916]/80 hover:bg-[#140e26] transition-colors group">
              <div className="text-[9px] font-mono text-[var(--signal)]">01 // SIGNAL</div>
              <div className="text-[11px] font-medium text-[var(--bone)] mt-0.5 group-hover:text-white">Autonomous Feed</div>
            </a>
            <a href="#threat-layer" className="p-2.5 rounded-lg border border-[var(--line-soft)] hover:border-[var(--vermilion)]/40 bg-[#0c0916]/80 hover:bg-[#140e26] transition-colors group">
              <div className="text-[9px] font-mono text-[var(--vermilion)]">02 // THREAT LAYER</div>
              <div className="text-[11px] font-medium text-[var(--bone)] mt-0.5 group-hover:text-white">DOM Diff & Traps</div>
            </a>
            <a href="#engine" className="p-2.5 rounded-lg border border-[var(--line-soft)] hover:border-[var(--signal)]/40 bg-[#0c0916]/80 hover:bg-[#140e26] transition-colors group">
              <div className="text-[9px] font-mono text-[var(--bone-muted)]">03 // ENGINE</div>
              <div className="text-[11px] font-medium text-[var(--bone)] mt-0.5 group-hover:text-white">Self-Healing</div>
            </a>
            <a href="#telemetry" className="p-2.5 rounded-lg border border-[var(--line-soft)] hover:border-[var(--ember)]/40 bg-[#0c0916]/80 hover:bg-[#140e26] transition-colors group">
              <div className="text-[9px] font-mono text-[var(--ember)]">04 // RADAR GRID</div>
              <div className="text-[11px] font-medium text-[var(--bone)] mt-0.5 group-hover:text-white">Live Telemetry</div>
            </a>
          </div>
        </div>

        {/* Right Column: Hero Parallax Panel with Controlled Padding */}
        <div className="lg:col-span-5 flex items-center justify-center relative z-40 w-full overflow-visible">
          <HeroParallaxPanel />
        </div>
      </div>
    </section>
  );
}
