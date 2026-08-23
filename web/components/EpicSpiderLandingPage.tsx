"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Zap,
  RefreshCw,
  FileText,
  ArrowRight,
  Activity,
  Bot,
  Package,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  CornerWebArt,
  HalftoneRadialBurst,
  WebSlingerHeroSvg,
} from "@/components/SpiderArtSvg";
import { TypewriterSubhead } from "@/components/TypewriterSubhead";
import ParticleText from "@/components/ParticleText";
import { DiagonalWebShooter } from "@/components/DiagonalWebShooter";
import { ScraperNarrativeBackground } from "@/components/ScraperNarrativeBackground";
import { WebCursor } from "@/components/WebCursor";
import DotField from "@/components/DotField";
import { WebAttach } from "@/components/WebAttach";

export default function EpicSpiderLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

    
  React.useEffect(() => {
    const unsub = scrollY.on("change", () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    });
    return () => unsub();
  }, [scrollY]);

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
  });

    
  const heroSpiderOpacity = useTransform(smoothScroll, [0, 0.12], [1, 0]);
  const railSpiderOpacity = useTransform(smoothScroll, [0.08, 0.18], [0, 1]);

    
  const doubleDampened = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const spiderX = useTransform(
    smoothScroll,
    [0, 0.25, 0.5, 0.75, 1],
    [0, -12, 10, -14, 0],
  );

    
  const web1Draw = useTransform(smoothScroll, [0.08, 0.24], [0, 1]);
  const web2Draw = useTransform(smoothScroll, [0.26, 0.42], [0, 1]);
  const web3Draw = useTransform(smoothScroll, [0.44, 0.6], [0, 1]);
  const web4Draw = useTransform(smoothScroll, [0.62, 0.78], [0, 1]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans selection:bg-[var(--sv-magenta)] selection:text-white relative overflow-hidden transition-colors duration-200"
    >
      <DotField
        dotRadius={1.8}
        dotSpacing={16}
        bulgeStrength={75}
        glowRadius={220}
        sparkle={true}
        waveAmplitude={1.5}
        gradientFrom="rgba(255, 46, 99, 0.35)"
        gradientTo="rgba(0, 212, 255, 0.25)"
        glowColor="rgba(255, 46, 99, 0.2)"
      />

      <ScraperNarrativeBackground
        progressList={[web1Draw, web2Draw, web3Draw, web4Draw]}
      />

      <HalftoneRadialBurst className="absolute -top-20 right-0 w-[550px] h-[550px] z-0" />
      <HalftoneRadialBurst className="absolute top-[40%] left-[-150px] w-[500px] h-[500px] z-0" />

      <CornerWebArt className="absolute -top-10 -left-10 w-96 h-96 text-[#111111] opacity-[0.12]" />
      <CornerWebArt className="absolute top-[35%] -right-12 w-96 h-96 text-[#111111] rotate-90 opacity-[0.12]" />
      <CornerWebArt className="absolute bottom-10 -left-10 w-96 h-96 text-[#111111] rotate-180 opacity-[0.12]" />

      <div className="hidden lg:block fixed right-16 top-0 bottom-0 z-40 pointer-events-none w-32">
        <motion.svg
          style={{ opacity: railSpiderOpacity }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 overflow-visible"
          fill="none"
        >
          <motion.path
            d={useTransform(
              doubleDampened,
              (latestY) => `M 20 0 L 20 ${latestY + 180}`,
            )}
            stroke="#111111"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <motion.path
            d={useTransform(
              doubleDampened,
              (latestY) => `M 20 0 L 20 ${latestY + 180}`,
            )}
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />

          <motion.circle
            cx="20"
            cy={useTransform(
              doubleDampened,
              (latestY) => (latestY + 180) * 0.4,
            )}
            r="3"
            fill="#111111"
          />
          <motion.circle
            cx="20"
            cy={useTransform(
              doubleDampened,
              (latestY) => (latestY + 180) * 0.7,
            )}
            r="3"
            fill="#111111"
          />
        </motion.svg>

        <motion.div
          style={{ y: doubleDampened, x: spiderX, opacity: railSpiderOpacity }}
          className="absolute left-1/2 -translate-x-1/2 top-32 w-44 h-[440px]"
        >
          <WebSlingerHeroSvg
            className="w-full h-full"
            isClimbing={true}
            isScrolling={isScrolling}
          />
        </motion.div>
      </div>

      <header className="border-b-3 border-[#111111] bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_0_#111111]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E8194B] border-2 border-[#111111] flex items-center justify-center shadow-[3px_3px_0_#111111] -rotate-3">
            <span className="font-['Bangers'] text-2xl text-white">S</span>
          </div>
          <span className="spider-title text-3xl font-bold tracking-wider leading-none">
            SPIDER-SENSE
          </span>
          <Badge variant="info" className="hidden sm:inline-flex text-[10px]">
            AUTONOMOUS RADAR
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="font-bold border-2 border-[#111111]"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="magenta"
              size="sm"
              className="gap-1.5 comic-burst-btn bg-[#E8194B] text-white border-2 border-[#111111] shadow-[3px_3px_0_#111111]"
            >
              Open Control Room <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="min-h-[calc(100vh-73px)] px-6 py-10 md:py-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        <div className="lg:col-span-7 flex flex-col justify-center gap-6">
          <div>
            <Badge
              variant="warning"
              className="text-xs px-3 py-1 mb-4 bg-[#FFD400] text-[#111111]"
            >
              ⚡ AUTONOMOUS AI LEGAL & RECALL RADAR
            </Badge>

            <div className="w-full h-[140px] md:h-[180px] my-2">
              <ParticleText
                text="SPIDER-SENSE"
                particleSize={2.5}
                density={6}
                color="#E8194B"
                highlightColor="#00D4FF"
                scatter={190}
                gatherDuration={1400}
                stagger={150}
                pointerRepel={50}
                repelRadius={80}
                idleDrift={0.8}
                trigger="mount"
                fontSize="clamp(9.5rem, 10vw, 9rem)"
                fontWeight={500}
                fontFamily="'Bangers', 'Anton', sans-serif"
                glow
              />
            </div>
          </div>

          <TypewriterSubhead />

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/dashboard">
              <Button
                variant="magenta"
                size="lg"
                className="comic-burst-btn bg-[#E8194B] text-white border-3 border-[#111111] shadow-[5px_5px_0_#111111] text-base font-['Bangers'] tracking-wider px-6 py-6 gap-2"
              >
                <Zap className="w-5 h-5" /> Open Control Room
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="yellow"
                size="lg"
                className="comic-burst-btn bg-[#FFD400] text-[#111111] border-3 border-[#111111] shadow-[5px_5px_0_#111111] text-base font-['Bangers'] tracking-wider px-6 py-6 gap-2"
              >
                <Lock className="w-5 h-5" /> Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center items-start relative h-full min-h-[460px] -mt-14">
          <motion.div
            style={{ opacity: heroSpiderOpacity }}
            animate={{
              rotate: [-16, 16, -16],
              x: [-15, 15, -15],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-full max-w-lg h-full flex justify-center items-start pt-0 origin-[50%_0%]"
          >
            <motion.div
              drag
              dragConstraints={{ left: -80, right: 80, top: 0, bottom: 120 }}
              dragElastic={0.4}
              whileDrag={{ scale: 1.08, cursor: "grabbing" }}
              dragSnapToOrigin={true}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-full h-full cursor-grab"
            >
              <WebSlingerHeroSvg
                className="w-full h-full max-h-[560px]"
                isClimbing={false}
                isScrolling={false}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col gap-28 relative z-10 border-t-3 border-[#111111]/20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="caption caption--cyan text-xs mb-2">
            SCROLL-CONNECTED RADAR SYSTEM
          </span>
          <h2 className="font-['Bangers'] text-4xl md:text-5xl text-[#111111] tracking-wide">
            AUTONOMOUS PROTECTION PANELS
          </h2>
          <p className="text-xs md:text-sm font-medium text-[#111111]/70 mt-1">
            Web strands shoot diagonally between panels to pull each radar block
            into position.
          </p>
        </div>

        <div className="relative flex justify-start">
          <WebAttach
            trigger="inView"
            persistent={true}
            anchorCorner="top-right"
            className="w-full lg:w-[78%]"
          >
            <div className="comic-panel comic-panel-notched bg-white border-3 border-[#111111] shadow-[8px_8px_0_#111111] p-6 md:p-8 relative overflow-hidden">
              <CornerWebArt className="absolute -top-6 -left-6 w-32 h-32 opacity-25 text-[#00D4FF]" />
              <CornerWebArt className="absolute -bottom-6 -right-6 w-32 h-32 opacity-25 text-[#E8194B] rotate-180" />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
                className="space-y-4 relative z-10"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="flex items-center justify-between border-b-2 border-[#111111] pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFD400] border-2 border-[#111111] flex items-center justify-center shadow-[3px_3px_0_#111111] -rotate-3">
                      <Package className="w-5 h-5 text-[#111111]" />
                    </div>
                    <div>
                      <Badge variant="warning" className="mb-0.5">
                        INVENTORY RADAR
                      </Badge>
                      <h3 className="font-['Bangers'] text-3xl text-[#111111] leading-none">
                        THINGS I OWN
                      </h3>
                    </div>
                  </div>
                  <span className="caption caption--ghost hidden sm:inline-block">
                    CPSC / NHTSA LIVE RECALL MONITOR
                  </span>
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                  className="text-xs md:text-sm text-[#111111]/80 font-medium"
                >
                  Tracks purchased household electronics, appliances, and
                  vehicles. Automatically fuzzy-matches serials against safety
                  recall registries.
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="space-y-2.5"
                >
                  {[
                    {
                      name: "Anker 535 Power Bank",
                      model: "A1366",
                      status: "RECALLED",
                      badge: "badge--critical",
                      note: "Fire Hazard - Immediate Replacement",
                    },
                    {
                      name: "LG Smart Refrigerator",
                      model: "LFXS26973S",
                      status: "CLEAR",
                      badge: "badge--healed",
                      note: "Zero active recalls found",
                    },
                    {
                      name: "Cosori Air Fryer 5.8QT",
                      model: "CP158-AF",
                      status: "ALERT",
                      badge: "badge--warning",
                      note: "Overheating Wire Connector Notice",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[var(--sv-paper)] border-2 border-[#111111] shadow-[3px_3px_0_#111111] flex items-center justify-between flex-wrap gap-2"
                    >
                      <div>
                        <span className="font-bold text-sm block text-[#111111]">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-[#111111]/70 font-mono">
                          Model: {item.model} • {item.note}
                        </span>
                      </div>
                      <span
                        className={`badge ${item.badge} text-[10px] px-2.5 py-1 font-['Bangers'] tracking-wider`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </WebAttach>
        </div>

        <div className="relative h-16 w-full pointer-events-none -my-10 z-20">
          <DiagonalWebShooter
            viewBox="0 0 500 120"
            pathD="M 380 0 C 320 50, 180 30, 110 110"
            progress={web1Draw}
            strokeColor="#00D4FF"
            waypointStart={[380, 0]}
            waypointMid={[250, 40]}
            waypointEnd={[110, 110]}
          />
        </div>

        <div className="relative flex justify-end">
          <WebAttach
            trigger="inView"
            persistent={true}
            anchorCorner="top-left"
            className="w-full lg:w-[78%]"
          >
            <div className="comic-panel comic-panel-notched bg-white border-3 border-[#111111] shadow-[8px_8px_0_#111111] p-6 md:p-8 relative overflow-hidden">
              <CornerWebArt className="absolute -top-6 -right-6 w-32 h-32 opacity-25 text-[#E8194B]" />
              <CornerWebArt className="absolute -bottom-6 -left-6 w-32 h-32 opacity-25 text-[#00D4FF] rotate-180" />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
                className="space-y-4 relative z-10"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="flex items-center justify-between border-b-2 border-[#111111] pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00D4FF] border-2 border-[#111111] flex items-center justify-center shadow-[3px_3px_0_#111111] rotate-3">
                      <FileText className="w-5 h-5 text-[#111111]" />
                    </div>
                    <div>
                      <Badge variant="info" className="mb-0.5">
                        TOS MONITORING
                      </Badge>
                      <h3 className="font-['Bangers'] text-3xl text-[#111111] leading-none">
                        SERVICES I USE
                      </h3>
                    </div>
                  </div>
                  <span className="caption caption--cyan hidden sm:inline-block">
                    AI POLICY DIFF ENGINE
                  </span>
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                  className="text-xs md:text-sm text-[#111111]/80 font-medium"
                >
                  Scrapes digital services continuously to flag hidden fee
                  increases, binding arbitration updates, and AI data training
                  consent clauses.
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="p-4 bg-[#111111] text-[#F5F1E6] border-2 border-[#111111] shadow-[4px_4px_0_#00D4FF] font-mono text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[#00D4FF] font-bold border-b border-white/15 pb-1.5">
                    <span>Adobe Creative Cloud — Terms Update</span>
                    <span className="text-[10px] bg-[#E8194B] text-white px-1.5 py-0.5 font-sans uppercase">
                      Critical Diff
                    </span>
                  </div>
                  <div className="text-red-400 line-through opacity-80">
                    - Section 4.2: We will never use your project assets to
                    train AI models without explicit opt-in.
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    + Section 4.2: You grant us a worldwide royalty-free license
                    to analyze project content for generative AI feature
                    refinement.
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </WebAttach>
        </div>

        <div className="relative h-16 w-full pointer-events-none -my-10 z-20">
          <DiagonalWebShooter
            viewBox="0 0 500 120"
            pathD="M 110 0 C 180 50, 320 30, 390 110"
            progress={web2Draw}
            strokeColor="#FFD400"
            waypointStart={[110, 0]}
            waypointMid={[250, 40]}
            waypointEnd={[390, 110]}
          />
        </div>

        <div className="relative flex justify-start">
          <WebAttach
            trigger="inView"
            persistent={true}
            anchorCorner="top-right"
            className="w-full lg:w-[78%]"
          >
            <div className="comic-panel comic-panel-notched bg-white border-3 border-[#111111] shadow-[8px_8px_0_#111111] p-6 md:p-8 relative overflow-hidden">
              <CornerWebArt className="absolute -top-6 -left-6 w-32 h-32 opacity-25 text-[#FFD400]" />
              <CornerWebArt className="absolute -bottom-6 -right-6 w-32 h-32 opacity-25 text-[#E8194B] rotate-180" />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
                className="space-y-4 relative z-10"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="flex items-center justify-between border-b-2 border-[#111111] pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E8194B] border-2 border-[#111111] flex items-center justify-center shadow-[3px_3px_0_#111111] -rotate-3">
                      <Activity className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                      <Badge variant="critical" className="mb-0.5">
                        LIVE STREAM
                      </Badge>
                      <h3 className="font-['Bangers'] text-3xl text-[#111111] leading-none">
                        ACTIVITY FEED
                      </h3>
                    </div>
                  </div>
                  <span className="caption caption--red hidden sm:inline-block">
                    REAL-TIME RADAR ALERTS
                  </span>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="space-y-3"
                >
                  {[
                    {
                      time: "2 mins ago",
                      type: "CRITICAL",
                      title: "Anker Power Bank Recall Confirmed",
                      desc: "Federal recall match found. Drafted replacement claim ready.",
                      color: "bg-[#E8194B] text-white",
                    },
                    {
                      time: "14 mins ago",
                      type: "WARNING",
                      title: "Spotify Subscription Price Hike",
                      desc: "Monthly Individual plan increased by $1.00 starting next billing cycle.",
                      color: "bg-[#FFD400] text-[#111111]",
                    },
                    {
                      time: "1 hour ago",
                      type: "INFO",
                      title: "Scraper Pipeline Auto-Healed",
                      desc: "Bright Data Scraper Studio adjusted DOM selector for Instacart ToS page.",
                      color: "bg-[#00D4FF] text-[#111111]",
                    },
                  ].map((feed, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border-2 border-[#111111] shadow-[3px_3px_0_#111111] flex items-start gap-3"
                    >
                      <span
                        className={`px-2 py-0.5 text-[9px] font-['Bangers'] tracking-wider ${feed.color} border border-[#111111]`}
                      >
                        {feed.type}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-[#111111]">
                            {feed.title}
                          </span>
                          <span className="text-[10px] text-[#111111]/60 font-mono">
                            {feed.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#111111]/80 mt-0.5">
                          {feed.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </WebAttach>
        </div>

        <div className="relative h-16 w-full pointer-events-none -my-10 z-20">
          <DiagonalWebShooter
            viewBox="0 0 500 120"
            pathD="M 390 0 C 320 50, 180 30, 110 110"
            progress={web3Draw}
            strokeColor="#10B981"
            waypointStart={[390, 0]}
            waypointMid={[250, 40]}
            waypointEnd={[110, 110]}
          />
        </div>

        <div className="relative flex justify-end">
          <WebAttach
            trigger="inView"
            persistent={true}
            anchorCorner="top-left"
            className="w-full lg:w-[78%]"
          >
            <div className="comic-panel comic-panel-notched bg-white border-3 border-[#111111] shadow-[8px_8px_0_#111111] p-6 md:p-8 relative overflow-hidden">
              <CornerWebArt className="absolute -top-6 -right-6 w-32 h-32 opacity-25 text-[#10B981]" />
              <CornerWebArt className="absolute -bottom-6 -left-6 w-32 h-32 opacity-25 text-[#E8194B] rotate-180" />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
                className="space-y-4 relative z-10"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="flex items-center justify-between border-b-2 border-[#111111] pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#10B981] border-2 border-[#111111] flex items-center justify-center shadow-[3px_3px_0_#111111] rotate-3">
                      <RefreshCw className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Badge
                        variant="info"
                        className="mb-0.5 bg-[#10B981] text-white border-0"
                      >
                        BRIGHT DATA AI
                      </Badge>
                      <h3 className="font-['Bangers'] text-3xl text-[#111111] leading-none">
                        SCRAPER HEALTH
                      </h3>
                    </div>
                  </div>
                  <span className="caption caption--ghost hidden sm:inline-block">
                    SELF-HEALING PIPELINE LOG
                  </span>
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                  className="text-xs md:text-sm text-[#111111]/80 font-medium"
                >
                  When targets update HTML structure or scramble class names,
                  Bright Data Scraper Studio detects broken selectors and
                  self-heals in real time.
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="p-4 bg-[var(--sv-paper)] border-2 border-[#111111] shadow-[3px_3px_0_#111111] space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E8194B] animate-ping" />
                      Target: instacart.com/terms
                    </span>
                    <span className="badge badge--healed text-[9px] bg-[#10B981]">
                      HEALED IN 1.2S
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono bg-white p-2.5 border border-[#111111]">
                    <div className="text-red-600 font-semibold">
                      Selector .tos-body-text Broken (404)
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#111111]" />
                    <div className="text-emerald-700 font-semibold">
                      Healed → &apos;main article [data-testid]&apos;
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </WebAttach>
        </div>

        <div className="relative h-16 w-full pointer-events-none -my-10 z-20">
          <DiagonalWebShooter
            viewBox="0 0 500 120"
            pathD="M 110 0 C 180 50, 320 30, 390 110"
            progress={web4Draw}
            strokeColor="#E8194B"
            waypointStart={[110, 0]}
            waypointMid={[250, 40]}
            waypointEnd={[390, 110]}
          />
        </div>

        <div className="relative flex justify-start">
          <WebAttach
            trigger="inView"
            persistent={true}
            anchorCorner="top-right"
            className="w-full lg:w-[78%]"
          >
            <div className="comic-panel comic-panel-notched bg-white border-3 border-[#111111] shadow-[8px_8px_0_#111111] p-6 md:p-8 relative overflow-hidden">
              <CornerWebArt className="absolute -top-6 -left-6 w-32 h-32 opacity-25 text-[#E8194B]" />
              <CornerWebArt className="absolute -bottom-6 -right-6 w-32 h-32 opacity-25 text-[#FFD400] rotate-180" />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
                className="space-y-4 relative z-10"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="flex items-center justify-between border-b-2 border-[#111111] pb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E8194B] border-2 border-[#111111] flex items-center justify-center shadow-[3px_3px_0_#111111] -rotate-3">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Badge variant="critical" className="mb-0.5">
                        GEMINI 3.6 FLASH
                      </Badge>
                      <h3 className="font-['Bangers'] text-3xl text-[#111111] leading-none">
                        AGENTIC AI DISPATCH
                      </h3>
                    </div>
                  </div>
                  <span className="caption caption--red hidden sm:inline-block">
                    AUTONOMOUS DRAFTING ENGINE
                  </span>
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                  className="text-xs md:text-sm text-[#111111]/80 font-medium"
                >
                  Autonomous agent generates ready-to-send dispute scripts,
                  cancellation emails, and recall refund claim notices
                  instantly.
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="p-4 bg-[#111111] text-white border-2 border-[#111111] shadow-[4px_4px_0_#E8194B] font-mono text-xs space-y-3"
                >
                  <div className="flex items-center justify-between text-[#FFD400] font-bold border-b border-white/20 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#FFD400]" /> Drafted
                      Cancellation Script #891
                    </span>
                    <span className="text-[9px] bg-[#E8194B] text-white px-2 py-0.5 uppercase font-sans">
                      Ready To Send
                    </span>
                  </div>
                  <p className="text-white/80 leading-relaxed italic">
                    "Dear Customer Support, pursuant to Section 12.3 of your
                    updated terms effective Aug 2026, I hereby reject the
                    binding arbitration clause and exercise my 30-day statutory
                    opt-out right for Account #4928..."
                  </p>
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="magenta"
                      size="sm"
                      className="bg-[#E8194B] text-white border border-white text-[10px] font-['Bangers'] tracking-wider px-3 py-1"
                    >
                      Copy Script To Clipboard
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </WebAttach>
        </div>
      </div>

      <footer className="border-t-3 border-[#111111] bg-white px-6 py-8 text-center text-xs text-[#111111] font-mono mt-20 relative z-10 shadow-[0_-4px_0_#111111]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-['Bangers'] text-xl text-[#E8194B]">
              SPIDER-SENSE
            </span>
            <span>
              • Powered by Bright Data Scraper Studio & Gemini 3.6 Flash
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <Link href="/dashboard" className="hover:underline">
              Control Room
            </Link>
            <Link href="/login" className="hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
