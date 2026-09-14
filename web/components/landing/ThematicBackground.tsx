"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface ScenarioScene {
  id: string;
  title: string;
  src: string;
  triggerSelector: string;
  accentColor: string;
}

const SCENARIOS: ScenarioScene[] = [
  {
    id: "hero",
    title: "Metropolis Sentinel Overlook",
    src: "/assets/scenery/scene-hero-skyline.jpg",
    triggerSelector: "#hero",
    accentColor: "rgba(0, 229, 255, 0.18)",
  },
  {
    id: "threat",
    title: "Cryptographic Threat Vault",
    src: "/assets/scenery/scene-threat-vault.jpg",
    triggerSelector: "#scanner",
    accentColor: "rgba(224, 35, 28, 0.22)",
  },
  {
    id: "engine",
    title: "Neural Engine Matrix",
    src: "/assets/scenery/scene-engine-matrix.jpg",
    triggerSelector: "#pipeline",
    accentColor: "rgba(0, 229, 255, 0.2)",
  },
  {
    id: "command",
    title: "Orbital Command Deck",
    src: "/assets/scenery/scene-command-deck.jpg",
    triggerSelector: "#telemetry",
    accentColor: "rgba(255, 107, 43, 0.2)",
  },
];

export function ThematicBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);
  const mousePos = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial opacities: hero visible, others faded
    layersRef.current.forEach((layer, idx) => {
      if (!layer) return;
      gsap.set(layer, {
        opacity: idx === 0 ? 0.38 : 0,
        scale: 1.05,
      });
    });

    const ctx = gsap.context(() => {
      // 1. SCROLLTRIGGER SCENE CROSS-FADES
      // Scene 0 -> Scene 1 (Hero to Threat Scanner)
      ScrollTrigger.create({
        trigger: "#scanner",
        start: "top 80%",
        end: "top 20%",
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress;
          if (layersRef.current[0]) {
            gsap.set(layersRef.current[0], { opacity: (1 - p) * 0.38, y: -p * 40 });
          }
          if (layersRef.current[1]) {
            gsap.set(layersRef.current[1], { opacity: p * 0.45, y: (1 - p) * 40 });
          }
        },
      });

      // Scene 1 -> Scene 2 (Threat Scanner to Engine Pipeline)
      ScrollTrigger.create({
        trigger: "#pipeline",
        start: "top 80%",
        end: "top 20%",
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress;
          if (layersRef.current[1]) {
            gsap.set(layersRef.current[1], { opacity: (1 - p) * 0.45, y: -p * 40 });
          }
          if (layersRef.current[2]) {
            gsap.set(layersRef.current[2], { opacity: p * 0.42, y: (1 - p) * 40 });
          }
        },
      });

      // Scene 2 -> Scene 3 (Engine to Telemetry Bento & Command Deck)
      ScrollTrigger.create({
        trigger: "#telemetry",
        start: "top 80%",
        end: "top 20%",
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress;
          if (layersRef.current[2]) {
            gsap.set(layersRef.current[2], { opacity: (1 - p) * 0.42, y: -p * 40 });
          }
          if (layersRef.current[3]) {
            gsap.set(layersRef.current[3], { opacity: p * 0.46, y: (1 - p) * 40 });
          }
        },
      });
    }, container);

    // 2. MOUSE PARALLAX TILT DRIFT
    const onMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mousePos.current.x = (e.clientX / innerWidth - 0.5) * 20;
      mousePos.current.y = (e.clientY / innerHeight - 0.5) * 16;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let rafId: number;
    const animateParallax = () => {
      mousePos.current.currentX += (mousePos.current.x - mousePos.current.currentX) * 0.05;
      mousePos.current.currentY += (mousePos.current.y - mousePos.current.currentY) * 0.05;

      layersRef.current.forEach((layer) => {
        if (!layer) return;
        layer.style.transform = `translate3d(${mousePos.current.currentX}px, ${mousePos.current.currentY}px, 0)`;
      });

      rafId = requestAnimationFrame(animateParallax);
    };
    animateParallax();

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 4 SCENIC THEME BACKDROP LAYERS */}
      {SCENARIOS.map((scenario, idx) => (
        <div
          key={scenario.id}
          ref={(el) => {
            layersRef.current[idx] = el;
          }}
          className="absolute inset-[-4%] w-[108%] h-[108%] transition-transform duration-75 will-change-transform"
          style={{ willChange: "opacity, transform" }}
        >
          <Image
            src={scenario.src}
            alt={scenario.title}
            fill
            priority={idx === 0}
            sizes="100vw"
            className="object-cover object-center filter brightness-[0.75] contrast-[1.15]"
          />

          {/* Individual Ambient Scrim & Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 65% at 50% 45%, transparent 15%, #08060D 80%)`,
            }}
          />
        </div>
      ))}

      {/* GLOBAL DARK OBSIDIAN TINT (Protects text contrast) */}
      <div
        className="absolute inset-0 bg-[#08060D]/65 backdrop-blur-[1px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,6,13,0.5) 0%, rgba(8,6,13,0.3) 35%, rgba(8,6,13,0.5) 70%, rgba(8,6,13,0.92) 100%)",
        }}
      />

      {/* Cyber Grid Scanning Scanlines Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
