'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import {
  Eye,
  Sparkles,
  Zap,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  FileText,
  BellRing,
} from 'lucide-react';

interface StorySlide {
  id: string;
  stepNum: string;
  senseTag: string;
  senseIcon: React.ReactNode;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  takeaway: string;
  themeColor: string;
  themeBorder: string;
  themeGlow: string;
}

const SLIDES: StorySlide[] = [
  {
    id: 'trap',
    stepNum: '01',
    senseTag: 'THE REALITY',
    senseIcon: <AlertCircle className="w-4 h-4 text-red-400" />,
    eyebrow: 'THE "I AGREE" TRAP',
    title: 'You sign away your rights in fine print you never read.',
    titleAccent: 'Companies quietly rewrite the rules at 2:00 AM.',
    description:
      'Every week, the digital services you rely on update their terms. Behind 40 pages of legal noise, they slip in clauses to train AI on your private photos, eliminate your right to refunds, and force you into binding arbitration. You only find out when it is already too late.',
    takeaway: 'Over 99% of digital consumers agree blindly without knowing what rights were quietly surrendered.',
    themeColor: 'from-red-500/20 via-red-950/10 to-transparent',
    themeBorder: 'border-red-500/30',
    themeGlow: 'rgba(224, 35, 28, 0.25)',
  },
  {
    id: 'peripheral-watch',
    stepNum: '02',
    senseTag: '01 // SIGHT & SOUND',
    senseIcon: <Eye className="w-4 h-4 text-cyan-400" />,
    eyebrow: 'PERIPHERAL WATCH',
    title: 'An early-warning radar that never blinks.',
    titleAccent: 'We see shifts the instant they appear on any page you care about.',
    description:
      'Working quietly in the background like human peripheral vision, Spider-Sense keeps continuous watch over every agreement, subscription policy, and product safety registry connected to your life. The moment a company alters a single sentence, our radar intercepts the shift.',
    takeaway: 'Zero manual checking required. Constant vigilant watch across all your active accounts.',
    themeColor: 'from-cyan-500/20 via-cyan-950/10 to-transparent',
    themeBorder: 'border-cyan-500/30',
    themeGlow: 'rgba(0, 229, 255, 0.25)',
  },
  {
    id: 'plain-speech',
    stepNum: '03',
    senseTag: '02 // VOICE & ADAPTIVE MEMORY',
    senseIcon: <Sparkles className="w-4 h-4 text-amber-400" />,
    eyebrow: 'PLAIN SPEECH TRANSLATION',
    title: 'Translating 50 pages of corporate legalese',
    titleAccent: 'into two clear sentences: Here is what changed. Here is why you care.',
    description:
      'No complex diffs or confusing legal terms. Our intelligence engine audits the underlying meaning of every modification. Even when platforms redesign their pages or erect shields, our adaptive memory auto-repairs so your watch never goes dark.',
    takeaway: 'Instant clarity in plain conversational English, delivered before any policy goes into effect.',
    themeColor: 'from-amber-500/20 via-amber-950/10 to-transparent',
    themeBorder: 'border-amber-500/30',
    themeGlow: 'rgba(255, 212, 0, 0.25)',
  },
  {
    id: 'actionable-reflex',
    stepNum: '04',
    senseTag: '03 // THE SIXTH SENSE',
    senseIcon: <Zap className="w-4 h-4 text-emerald-400" />,
    eyebrow: 'ACTIONABLE REFLEX',
    title: 'Immediate alerts delivered straight to your radar',
    titleAccent: 'with one-tap actions so you can react before damage is done.',
    description:
      'Knowledge without action is useless. When an alert triggers, Spider-Sense equips you with ready-to-send dispute scripts, formal opt-out notices, and cancellation paths. You stay completely in control with a single tap.',
    takeaway: 'Turn hidden risks into immediate protective actions in under ten seconds.',
    themeColor: 'from-emerald-500/20 via-emerald-950/10 to-transparent',
    themeBorder: 'border-emerald-500/30',
    themeGlow: 'rgba(16, 185, 129, 0.25)',
  },
];

export function ThreatScanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  const sampleOptOutScript = `To Legal & Privacy Compliance Team,

Pursuant to Section 14.2 of your updated Terms of Service, I hereby formally exercise my right to OPT OUT of mandatory binding arbitration and the automated utilization of my uploaded personal data for artificial intelligence model training.

Account ID: USER_REF_981442
Effective Date: Immediately upon receipt.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleOptOutScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.set(card, {
          x: i === 0 ? '0%' : '110%',
          y: '0%',
          scale: 1,
          rotateZ: 0,
          opacity: 1,
          pointerEvents: i === 0 ? 'auto' : 'none',
          zIndex: 10 + i, 
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: '+=3000',
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              Math.floor(self.progress * SLIDES.length),
              SLIDES.length - 1
            );
            setActiveSlide(idx);
          },
        },
      });

      for (let i = 1; i < SLIDES.length; i++) {
        const prevCard = cardRefs.current[i - 1];
        const nextCard = cardRefs.current[i];
        const stepLabel = `step${i}`;

        if (prevCard && nextCard) {
          tl.to(
            nextCard,
            {
              x: '0%',
              scale: 1,
              rotateZ: 0,
              pointerEvents: 'auto',
              ease: 'power2.out',
              duration: 1.2,
            },
            stepLabel
          );

          tl.to(
            prevCard,
            {
              scale: 0.94 - (i * 0.02),
              x: '-5%',
              y: '-2%',
              rotateZ: -1.5,
              pointerEvents: 'none',
              ease: 'power2.out',
              duration: 1.2,
            },
            stepLabel
          );
        }
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="scanner"
      className="relative w-full overflow-hidden"
    >
      <div className="relative h-screen w-screen overflow-hidden flex flex-col justify-between py-4 sm:py-6">
        
        <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
          
          <div
            ref={(el) => {
              cardRefs.current[0] = el;
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center p-4  md:p-8 will-change-transform"
          >
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center bg-[#0d0914] border border-red-500/30 rounded-2xl p-6  md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
              
              <div className="lg:col-span-6 flex flex-col">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/40 bg-red-500/10 w-fit mb-3">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[11px] font-mono tracking-widest text-red-400 uppercase font-semibold">
                    {SLIDES[0].eyebrow}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--bone)] leading-snug">
                  {SLIDES[0].title}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-[var(--ember)]">
                    {SLIDES[0].titleAccent}
                  </span>
                </h2>

                <p className="mt-3 text-xs sm:text-sm text-[var(--bone-muted)] leading-relaxed font-light">
                  {SLIDES[0].description}
                </p>

                <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-950/30">
                  <p className="text-xs font-mono text-red-300">
                    💡 {SLIDES[0].takeaway}
                  </p>
                </div>
              </div>

              {/* Right Visual Showcase: The Quiet Midnight Rewrite */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl border border-red-500/30 bg-[#0c0812]/95 backdrop-blur-2xl p-6  shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-mono text-white/80 font-medium">TERMS OF SERVICE // QUIET AMENDMENT</span>
                    </div>
                    <span className="text-[11px] font-mono text-red-400 font-bold px-2.5 py-0.5 rounded bg-red-500/20 border border-red-500/30">
                      MODIFIED 02:14 AM
                    </span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm font-serif text-white/60 leading-relaxed">
                    <p className="opacity-40">
                      Section 11.1 — Governing law and venue shall be determined by our sovereign headquarters without exception...
                    </p>
                    
                    {/* The Snuck-in Clause */}
                    <div className="relative p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-white shadow-[0_0_25px_rgba(224,35,28,0.2)]">
                      <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        UNNOTICED SNEAK CLAUSE INSERTED
                      </div>
                      <p className="text-xs sm:text-sm font-sans font-medium text-red-100 italic">
                        &ldquo;...By continuing usage, you grant us irrevocable, royalty-free, worldwide license to ingest, synthesize, and train artificial intelligence models using all content and files uploaded to your account...&rdquo;
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-red-300">
                        <span>IMPACT: RIGHTS LOSS &amp; DATA HARVESTING</span>
                        <span className="font-bold text-red-400">STATUS: ACTIVE</span>
                      </div>
                    </div>

                    <p className="opacity-40">
                      Section 11.3 — You expressly waive all participation in class actions or dispute juries across jurisdictions...
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/40">
                    <span>STATUS FOR THE CONSUMER</span>
                    <span className="text-red-400 font-bold">SILENT &amp; UNNOTICED</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SLIDE 2: PERIPHERAL WATCH */}
          <div
            ref={(el) => {
              cardRefs.current[1] = el;
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center p-4  md:p-8 will-change-transform"
          >
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center bg-[#070e17] border border-cyan-500/30 rounded-2xl p-6  md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
              
              {/* Left Editorial Copy */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/40 bg-cyan-400/10 w-fit mb-3">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase font-semibold">
                    {SLIDES[1].eyebrow}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--bone)] leading-snug">
                  {SLIDES[1].title}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[var(--signal)]">
                    {SLIDES[1].titleAccent}
                  </span>
                </h2>

                <p className="mt-3 text-xs sm:text-sm text-[var(--bone-muted)] leading-relaxed font-light">
                  {SLIDES[1].description}
                </p>

                <div className="mt-4 p-3 rounded-xl border border-cyan-500/20 bg-cyan-950/30">
                  <p className="text-xs font-mono text-cyan-300">
                    ⚡ {SLIDES[1].takeaway}
                  </p>
                </div>
              </div>

              {/* Right Visual Showcase: Real-Time Radar Sentinel Sweep */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl border border-cyan-400/30 bg-[#060a12] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-xs font-mono text-white/80 font-medium">REAL-TIME RADAR SENTINEL // ACTIVE WATCH</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-400/20 border border-cyan-400/30">
                      SCANNING 24/7
                    </span>
                  </div>

                  {/* Visual Radar Feed */}
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center font-mono text-xs text-cyan-300 font-bold">
                          01
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-white">Google Workspace Privacy Terms</div>
                          <div className="text-[10px] sm:text-[11px] font-mono text-white/50">Baseline snapshot verified • 0 alterations</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400">CLEAR</span>
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-400/50 flex items-center justify-between shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center font-mono text-xs text-red-400 font-bold">
                          !
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-white">Creative Cloud User Agreement</div>
                          <div className="text-[10px] sm:text-[11px] font-mono text-red-400 font-medium">Material shift intercepted • Section 11.2 modified</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-red-400 font-bold px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30">
                        SHIFT DETECTED
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center font-mono text-xs text-cyan-300 font-bold">
                          03
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-white">Spotify Terms of Subscription</div>
                          <div className="text-[10px] sm:text-[11px] font-mono text-white/50">Price guarantee lock active • Baseline intact</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400">CLEAR</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/40">
                    <span>PERIPHERAL REACTION TIME</span>
                    <span className="text-cyan-300 font-bold">SUB-SECOND DETECTION</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SLIDE 3: PLAIN SPEECH TRANSLATION */}
          <div
            ref={(el) => {
              cardRefs.current[2] = el;
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center p-4  md:p-8 will-change-transform"
          >
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center bg-[#100c14] border border-amber-500/30 rounded-2xl p-6  md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
              
              {/* Left Editorial Copy */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/40 bg-amber-400/10 w-fit mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-mono tracking-widest text-amber-300 uppercase font-semibold">
                    {SLIDES[2].eyebrow}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--bone)] leading-snug">
                  {SLIDES[2].title}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[var(--signal)]">
                    {SLIDES[2].titleAccent}
                  </span>
                </h2>

                <p className="mt-3 text-xs sm:text-sm text-[var(--bone-muted)] leading-relaxed font-light">
                  {SLIDES[2].description}
                </p>

                <div className="mt-4 p-3 rounded-xl border border-amber-500/20 bg-amber-950/30">
                  <p className="text-xs font-mono text-amber-300">
                    ✨ {SLIDES[2].takeaway}
                  </p>
                </div>
              </div>

              {/* Right Visual Showcase: Side-by-Side Legalese vs Plain Speech */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl border border-amber-400/30 bg-[#0d0910] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <span className="text-xs font-mono text-white/80 font-medium">CLAUSE MEANING AUDIT // INSTANT TRANSLATION</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-400/20 border border-emerald-400/30">
                      AUDIT COMPLETE
                    </span>
                  </div>

                  {/* Dense Legalese (Before) */}
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 opacity-50">
                    <div className="text-[10px] font-mono text-white/50 mb-1">50-PAGE LEGAL JARGON</div>
                    <p className="text-xs font-serif text-white/70 italic line-through">
                      &ldquo;Subject to statutory exclusions in subsection 4.b, customer hereby covenants and waives procedural recourse regarding indemnification clauses...&rdquo;
                    </p>
                  </div>

                  <div className="my-2.5 flex items-center justify-center">
                    <span className="text-[10px] sm:text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-400/30 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      SPIDER-SENSE PLAIN SPEECH SYNTHESIS
                    </span>
                  </div>

                  {/* Plain English (After) */}
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 shadow-[0_0_20px_rgba(255,212,0,0.15)]">
                    <div className="text-[11px] font-mono text-amber-300 font-bold mb-1 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      HERE IS WHAT CHANGED &bull; HERE IS WHY YOU CARE
                    </div>
                    <p className="text-xs sm:text-sm font-sans text-white/95 leading-relaxed font-medium">
                      &ldquo;They added a clause allowing them to feed your work into AI training systems. If you don&rsquo;t send an opt-out notice before October 1, your consent becomes automatic.&rdquo;
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/40">
                    <span>ADAPTIVE MEMORY</span>
                    <span className="text-amber-300 font-bold">100% UNINTERRUPTED PROTECTION</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SLIDE 4: ACTIONABLE REFLEX */}
          <div
            ref={(el) => {
              cardRefs.current[3] = el;
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center p-4  md:p-8 will-change-transform"
          >
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center bg-[#07130e] border border-emerald-500/30 rounded-2xl p-6  md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
              
              {/* Left Editorial Copy */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 w-fit mb-3">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-mono tracking-widest text-emerald-300 uppercase font-semibold">
                    {SLIDES[3].eyebrow}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--bone)] leading-snug">
                  {SLIDES[3].title}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[var(--signal)]">
                    {SLIDES[3].titleAccent}
                  </span>
                </h2>

                <p className="mt-3 text-xs sm:text-sm text-[var(--bone-muted)] leading-relaxed font-light">
                  {SLIDES[3].description}
                </p>

                <div className="mt-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/30">
                  <p className="text-xs font-mono text-emerald-300">
                    🛡️ {SLIDES[3].takeaway}
                  </p>
                </div>
              </div>

              {/* Right Visual Showcase: The 1-Click Action Intercept Card */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl border border-emerald-400/30 bg-[#06100b] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono text-white/80 font-medium">ACTION ALERT READY // ONE TAP REACTION</span>
                    </div>
                    <span className="text-[11px] font-mono text-red-400 font-bold px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30">
                      CRITICAL SEVERITY
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30">
                    <div className="text-[10px] font-mono text-emerald-400 mb-1 uppercase tracking-wider font-semibold">
                      PRE-COMPOSED FORMAL NOTICE (READY TO SEND)
                    </div>
                    <pre className="text-xs font-mono text-white/90 whitespace-pre-wrap leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5 max-h-[120px] overflow-y-auto">
                      {sampleOptOutScript}
                    </pre>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[10px] sm:text-[11px] font-mono text-white/50">
                        1-TAP FORMAL OPT-OUT
                      </span>
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-black" />
                            <span>COPIED TO CLIPBOARD</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-black" />
                            <span>COPY DISPUTE NOTICE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/40">
                    <span>RESOLVED TIME</span>
                    <span className="text-emerald-400 font-bold">1 CLICK // COMPLETE PROTECTION</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM PAGINATION & SLIDE DOTS */}
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between border-t border-white/10 pt-4 z-50">
          <div className="flex items-center gap-2">
            {SLIDES.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === idx
                    ? 'w-8 bg-[var(--signal)] shadow-[0_0_10px_rgba(0,229,255,0.8)]'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
            <span className="text-xs font-mono text-white/50 ml-2">
              0{activeSlide + 1} / 0{SLIDES.length}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--bone-muted)]">
            <span className="hidden sm:inline">CONTINUE SCROLLING TO ENTER THE SYSTEM</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--signal)] animate-bounce-x" />
          </div>
        </div>

      </div>
    </section>
  );
}