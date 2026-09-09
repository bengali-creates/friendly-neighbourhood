'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { gsap } from '@/lib/gsap';
import { PerspectiveGrid } from './foreground/PerspectiveGrid';

export function CommandDeck() {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const fgGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      // Scale-in transition for Command Deck Card
      gsap.fromTo(
        card,
        { opacity: 0, scale: 0.92, y: 50 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Perspective Grid rising
      if (fgGridRef.current) {
        gsap.fromTo(
          fgGridRef.current,
          { opacity: 0, y: 80 },
          {
            opacity: 0.9,
            y: 0,
            duration: 1.4,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, containerRef);

    // Magnetic CTA Button micro-interaction
    const btn = buttonRef.current;
    if (btn) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        gsap.to(btn, {
          x: x * 0.35,
          y: y * 0.35,
          duration: 0.3,
          ease: 'power2.out',
        });
      };
      const handleMouseLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.4)',
        });
      };

      btn.addEventListener('mousemove', handleMouseMove);
      btn.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        btn.removeEventListener('mousemove', handleMouseMove);
        btn.removeEventListener('mouseleave', handleMouseLeave);
        ctx.revert();
      };
    }

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="command-deck"
      className="relative min-h-screen flex flex-col items-center justify-center py-28 px-6 sm:px-10 overflow-hidden"
    >
      {/* Chapter Scrim (z: -1): Focused glow */}
      <div
        className="pointer-events-none absolute inset-[-20%_-5%] z-[-1]"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 50% 60%, rgba(0, 229, 255, 0.08), rgba(8, 6, 13, 0.95) 80%)',
        }}
        aria-hidden="true"
      />

      {/* FOREGROUND PERSPECTIVE GRID (z: 20) */}
      <div
        ref={fgGridRef}
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 opacity-0 select-none overflow-hidden"
        aria-hidden="true"
      >
        <PerspectiveGrid />
      </div>

      {/* COMMAND DECK HERO CARD (z: 10) */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-4xl rounded-3xl border border-[var(--line-strong)] bg-gradient-to-b from-[#140e24]/95 via-[#0d0918]/95 to-[#06040a]/98 p-8 sm:p-14 text-center backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* Subtle top light bar */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[var(--signal)] to-transparent opacity-75" />

        {/* Chapter Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--line-strong)] bg-[#07050c]/80 mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-ping" />
          <span className="text-[11px] font-mono tracking-widest text-[var(--bone)] uppercase">
            ACT V // COMMAND DECK
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--bone)] leading-tight max-w-2xl mx-auto">
          Take control of your web intelligence.
        </h2>

        <p className="mt-5 text-base sm:text-lg text-[var(--bone-muted)] max-w-xl mx-auto font-light leading-relaxed">
          Deploy your first autonomous collector in under 3 minutes. Zero proxy subscriptions, zero brittle regular expressions, full AI-powered stealth.
        </p>

        {/* Magnetic High-Impact CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
          <Link
            ref={buttonRef}
            href="/signup"
            className="cta-slide group relative inline-flex items-center justify-center px-9 py-4 rounded-xl font-medium text-sm text-[#08060D] bg-[var(--signal)] shadow-[0_0_35px_rgba(0,229,255,0.5)] hover:shadow-[0_0_50px_rgba(0,229,255,0.8)] transition-all cursor-pointer"
          >
            <span className="relative z-10 font-mono font-bold tracking-wider uppercase text-xs flex items-center gap-3">
              Initialize Command Deck
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

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-[var(--line-soft)] hover:border-[var(--line-strong)] bg-[#120e20]/60 hover:bg-[#1a142e]/80 text-[var(--bone)] text-xs font-mono uppercase tracking-wider backdrop-blur-md transition-all"
          >
            Operator Sign In
          </Link>
        </div>

        {/* Telemetry Footnote */}
        <div className="mt-10 pt-6 border-t border-[var(--line-soft)] flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--bone-muted)]">
          <div>NODE: ACTIVE // 256-BIT ENCRYPTION</div>
          <div className="flex items-center gap-3">
            <span className="text-[var(--signal)]">● SYSTEM NOMINAL</span>
            <span>BUILD: 2026.09</span>
          </div>
        </div>
      </div>

      {/* MINIMALIST FOOTER */}
      <footer className="relative z-10 mt-16 text-center text-xs font-mono text-[var(--bone-muted)] flex flex-col sm:flex-row items-center justify-between w-full max-w-4xl border-t border-[var(--line-soft)]/50 pt-8">
        <div>© 2026 SPIDER-SENSE INTELLIGENCE. ALL RIGHTS RESERVED.</div>
        <div className="flex items-center gap-6 mt-3 sm:mt-0">
          <span className="hover:text-[var(--bone)] transition-colors cursor-pointer">PRIVACY</span>
          <span className="hover:text-[var(--bone)] transition-colors cursor-pointer">ARCHITECTURE</span>
          <span className="hover:text-[var(--bone)] transition-colors cursor-pointer">SECURITY</span>
        </div>
      </footer>
    </section>
  );
}
