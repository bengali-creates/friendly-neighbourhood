'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from '@/lib/gsap';

interface SpideySenseCenterpieceProps {
  typingIntensity?: number;
}

interface LightningBranch {
  id: number;
  d: string;
  color: string;
  width: number;
}

export function SpideySenseCenterpiece({ typingIntensity = 0 }: SpideySenseCenterpieceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<SVGGElement>(null);
  const cyanLayerRef = useRef<SVGGElement>(null);
  const redLayerRef = useRef<SVGGElement>(null);
  const waveGroupRef = useRef<SVGGElement>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lightningBolts, setLightningBolts] = useState<LightningBranch[]>([]);

  // Generate random lightning arc paths originating from the center
  const generateLightning = useCallback((count = 4) => {
    const cx = 250;
    const cy = 250;
    const bolts: LightningBranch[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const length = 120 + Math.random() * 80;
      let currX = cx;
      let currY = cy;
      let path = `M ${currX} ${currY}`;

      const steps = 5;
      for (let s = 1; s <= steps; s++) {
        const progress = s / steps;
        const targetX = cx + Math.cos(angle) * (length * progress);
        const targetY = cy + Math.sin(angle) * (length * progress);
        const jitterX = (Math.random() - 0.5) * 28;
        const jitterY = (Math.random() - 0.5) * 28;
        currX = targetX + jitterX;
        currY = targetY + jitterY;
        path += ` L ${currX} ${currY}`;
      }

      bolts.push({
        id: Math.random(),
        d: path,
        color: Math.random() > 0.4 ? '#00E5FF' : '#E0231C',
        width: 1.5 + Math.random() * 1.5,
      });
    }

    setLightningBolts(bolts);
  }, []);

  // Ambient timeline: Spidey-sense wave pulsing and core breathing
  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({ repeat: -1 });

    // Staggered Spidey-sense radiating wave pulses
    if (waveGroupRef.current) {
      const waves = waveGroupRef.current.querySelectorAll('.sense-wave');
      waves.forEach((wave, idx) => {
        gsap.to(wave, {
          scale: 1.25,
          opacity: 0,
          transformOrigin: '250px 250px',
          duration: 2.2,
          repeat: -1,
          delay: idx * 0.45,
          ease: 'power1.out',
        });
      });
    }

    // Gentle chromatic drift
    if (cyanLayerRef.current && redLayerRef.current) {
      gsap.to(cyanLayerRef.current, {
        x: -3,
        y: 2,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to(redLayerRef.current, {
        x: 3,
        y: -2,
        duration: 2.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    // Periodic ambient crackle of bio-electric arcs
    const interval = setInterval(() => {
      generateLightning(Math.random() > 0.5 ? 3 : 2);
      setTimeout(() => setLightningBolts([]), 280);
    }, 1900);

    return () => {
      tl.kill();
      clearInterval(interval);
    };
  }, [generateLightning]);

  // Reaction on typing: explosive lightning burst and chromatic shockwave
  useEffect(() => {
    if (!typingIntensity) return;

    // Trigger instant electric surge
    generateLightning(6);
    const timeout = setTimeout(() => setLightningBolts([]), 380);

    // Violent chromatic split burst
    if (cyanLayerRef.current && redLayerRef.current && coreRef.current) {
      gsap.fromTo(
        cyanLayerRef.current,
        { x: -9, y: 5, opacity: 0.9 },
        { x: 0, y: 0, opacity: 0.7, duration: 0.35, ease: 'power2.out' }
      );
      gsap.fromTo(
        redLayerRef.current,
        { x: 9, y: -5, opacity: 0.9 },
        { x: 0, y: 0, opacity: 0.7, duration: 0.35, ease: 'power2.out' }
      );
      gsap.fromTo(
        coreRef.current,
        { scale: 1.35 },
        { scale: 1, duration: 0.3, ease: 'back.out(2.5)', transformOrigin: '250px 250px' }
      );
    }

    return () => clearTimeout(timeout);
  }, [typingIntensity, generateLightning]);

  // Mouse tilt and chromatic parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    setMousePos({ x, y });

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        rotateY: x * 14,
        rotateX: -y * 14,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 1000,
      });
    }

    // Dynamic chromatic aberration follow cursor
    if (cyanLayerRef.current && redLayerRef.current) {
      gsap.to(cyanLayerRef.current, {
        x: -x * 6,
        y: -y * 6,
        duration: 0.3,
        ease: 'power1.out',
      });
      gsap.to(redLayerRef.current, {
        x: x * 6,
        y: y * 6,
        duration: 0.3,
        ease: 'power1.out',
      });
    }
  };

  const handleMouseLeave = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => generateLightning(7)}
      className="relative w-[340px] h-[340px] xl:w-[380px] xl:h-[380px] flex items-center justify-center cursor-pointer select-none"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Background Halftone & Web Screen Glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, #00E5FF 0%, #E0231C 45%, transparent 70%)',
        }}
      />

      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_0_35px_rgba(0,229,255,0.25)]"
      >
        <defs>
          {/* Chromatic Glow Gradients */}
          <radialGradient id="spidey-cyan-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="spidey-red-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0231C" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#E0231C" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#E0231C" stopOpacity="0" />
          </radialGradient>

          {/* Comic Dot Pattern Filter */}
          <pattern id="halftone-dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="rgba(0, 229, 255, 0.15)" />
          </pattern>
        </defs>

        {/* Halftone backdrop disc */}
        <circle cx="250" cy="250" r="220" fill="url(#halftone-dots)" opacity="0.6" />

        {/* ── Layer A: Cyan Chromatic Offset ───────────────────────── */}
        <g ref={cyanLayerRef} opacity="0.75">
          {/* Classic Curved Spidey-Sense Radar Arcs */}
          {[-70, -45, -20, 0, 20, 45, 70].map((angle, i) => (
            <path
              key={`cyan-arc-${i}`}
              d={`M ${250 + Math.sin((angle * Math.PI) / 180) * 110} ${250 - Math.cos((angle * Math.PI) / 180) * 110} 
                  Q ${250 + Math.sin((angle * Math.PI) / 180) * 155} ${250 - Math.cos((angle * Math.PI) / 180) * 155} 
                    ${250 + Math.sin((angle * Math.PI) / 180) * 205} ${250 - Math.cos((angle * Math.PI) / 180) * 205}`}
              stroke="#00E5FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 6"
              opacity="0.6"
            />
          ))}
          <circle cx="250" cy="250" r="95" stroke="#00E5FF" strokeWidth="1.2" strokeDasharray="6 8" />
        </g>

        {/* ── Layer B: Red/Vermilion Chromatic Offset ────────────────── */}
        <g ref={redLayerRef} opacity="0.75">
          {[-70, -45, -20, 0, 20, 45, 70].map((angle, i) => (
            <path
              key={`red-arc-${i}`}
              d={`M ${250 + Math.sin((angle * Math.PI) / 180) * 110} ${250 - Math.cos((angle * Math.PI) / 180) * 110} 
                  Q ${250 + Math.sin((angle * Math.PI) / 180) * 155} ${250 - Math.cos((angle * Math.PI) / 180) * 155} 
                    ${250 + Math.sin((angle * Math.PI) / 180) * 205} ${250 - Math.cos((angle * Math.PI) / 180) * 205}`}
              stroke="#E0231C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 6"
              opacity="0.6"
            />
          ))}
          <circle cx="250" cy="250" r="95" stroke="#E0231C" strokeWidth="1.2" strokeDasharray="6 8" />
        </g>

        {/* ── Layer C: Concentric Spidey-Sense Wavy Shockwaves ──────── */}
        <g ref={waveGroupRef}>
          {[70, 115, 160, 205].map((r, i) => (
            <circle
              key={`wave-${i}`}
              className="sense-wave"
              cx="250"
              cy="250"
              r={r}
              stroke="url(#spidey-cyan-glow)"
              strokeWidth="1.8"
              fill="none"
              opacity="0.5"
            />
          ))}
        </g>

        {/* ── Layer D: Bio-Electric Lightning Arcs ─────────────────── */}
        {lightningBolts.map((bolt) => (
          <path
            key={bolt.id}
            d={bolt.d}
            stroke={bolt.color}
            strokeWidth={bolt.width}
            fill="none"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_8px_#00E5FF]"
          />
        ))}

        {/* ── Layer E: The Precognitive Eye / Sixth Sense Core ──────── */}
        <g ref={coreRef} className="cursor-pointer">
          {/* Radial auras */}
          <circle cx="250" cy="250" r="65" fill="url(#spidey-cyan-glow)" />
          <circle cx="250" cy="250" r="45" fill="url(#spidey-red-glow)" />

          {/* Central geometric iris */}
          <circle cx="250" cy="250" r="32" fill="#0A0815" stroke="#00E5FF" strokeWidth="2" />
          <circle cx="250" cy="250" r="22" stroke="#E0231C" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Core pupil pulse */}
          <circle cx="250" cy="250" r="10" fill="#00E5FF" className="animate-pulse" />
          <circle cx="250" cy="250" r="4" fill="#FFFFFF" />

          {/* Crosshair target lines */}
          <line x1="250" y1="210" x2="250" y2="225" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="250" y1="275" x2="250" y2="290" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="210" y1="250" x2="225" y2="250" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="275" y1="250" x2="290" y2="250" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Subtle HUD Coordinates */}
        <text
          x="250"
          y="460"
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fill="rgba(0, 229, 255, 0.6)"
          letterSpacing="0.25em"
        >
          SIXTH_SENSE // PRECOGNITION ACTIVE
        </text>
      </svg>
    </div>
  );
}
