'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap';

export interface SenseNode {
  id: number;
  label: string;
  sublabel: string;
  color: string;
  angle: number;
}

export const HUMAN_SENSES: SenseNode[] = [
  { id: 1, label: 'Sight',       sublabel: 'Peripheral Watch',     color: '0, 229, 255',   angle: -90 },
  { id: 2, label: 'Sound',       sublabel: 'Acoustic Signal',      color: '0, 229, 255',   angle: -30 },
  { id: 3, label: 'Instinct',    sublabel: 'Threat Intuition',     color: '255, 107, 43',  angle: 30  },
  { id: 4, label: 'Resilience',  sublabel: 'Adaptive Defense',     color: '0, 229, 255',   angle: 90  },
  { id: 5, label: 'Voice',       sublabel: 'Plain Speech',         color: '224, 35, 28',   angle: 150 },
  { id: 6, label: 'Sixth Sense', sublabel: 'Actionable Reflex',    color: '0, 229, 255',   angle: 210 },
];

const ORB_RADIUS = 125;
const CENTER = 180;

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface SixSensesOrbProps {
  typingIntensity?: number; // increments on typing to trigger interactive resonance
  hoveredSenseIndex?: number | null;
  onSenseSelect?: (index: number) => void;
}

export function SixSensesOrb({
  typingIntensity = 0,
  hoveredSenseIndex = null,
  onSenseSelect,
}: SixSensesOrbProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
  const coreRef = useRef<SVGGElement>(null);
  const sweepRef = useRef<SVGLineElement>(null);

  // Initial GSAP animation + continuous ambient rotation
  useEffect(() => {
    if (!svgRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // Radar rings fade in
    tl.fromTo(
      ringRefs.current.filter(Boolean),
      { opacity: 0, scale: 0.6, transformOrigin: `${CENTER}px ${CENTER}px` },
      { opacity: 1, scale: 1, duration: 1.0, stagger: 0.12 }
    );

    // Connecting lines draw
    lineRefs.current.filter(Boolean).forEach((line) => {
      if (!line) return;
      const len = 150;
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    });

    tl.to(
      lineRefs.current.filter(Boolean),
      { strokeDashoffset: 0, duration: 0.8, stagger: 0.08, ease: 'power1.inOut' },
      '-=0.4'
    );

    // Nodes pop in with spring back
    tl.fromTo(
      nodeRefs.current.filter(Boolean),
      { scale: 0, opacity: 0, transformOrigin: 'center center' },
      { scale: 1, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(2.5)' },
      '-=0.3'
    );

    // Continuous ambient radar sweep
    if (sweepRef.current) {
      gsap.to(sweepRef.current, {
        rotation: 360,
        repeat: -1,
        duration: 8,
        ease: 'none',
        transformOrigin: `${CENTER}px ${CENTER}px`,
      });
    }

    // Node continuous gentle float
    nodeRefs.current.forEach((node, i) => {
      if (!node) return;
      gsap.to(node, {
        y: (i % 2 === 0 ? -4 : 4),
        repeat: -1,
        yoyo: true,
        duration: 2.2 + (i * 0.3),
        ease: 'sine.inOut',
      });
    });

    return () => {
      tl.kill();
    };
  }, []);

  // React to user typing in form: sensory excitation ripples across nodes
  useEffect(() => {
    if (!typingIntensity) return;

    // Pulse core
    if (coreRef.current) {
      gsap.fromTo(
        coreRef.current,
        { scale: 1.4 },
        { scale: 1, duration: 0.3, ease: 'power2.out', transformOrigin: `${CENTER}px ${CENTER}px` }
      );
    }

    // Pick random node to hyper-glow
    const targetIdx = Math.floor(Math.random() * nodeRefs.current.length);
    const targetNode = nodeRefs.current[targetIdx];
    if (targetNode) {
      gsap.fromTo(
        targetNode,
        { scale: 1.35 },
        { scale: 1, duration: 0.4, ease: 'back.out(2)', transformOrigin: 'center center' }
      );
    }

    // Flash connecting lines
    const targetLine = lineRefs.current[targetIdx];
    if (targetLine) {
      gsap.fromTo(
        targetLine,
        { strokeOpacity: 1, strokeWidth: 2.5 },
        { strokeOpacity: 0.35, strokeWidth: 1, duration: 0.5, ease: 'power1.out' }
      );
    }
  }, [typingIntensity]);

  // React to hover selection from list or direct node interaction
  useEffect(() => {
    if (hoveredSenseIndex === null || hoveredSenseIndex === undefined) return;
    const node = nodeRefs.current[hoveredSenseIndex];
    if (node) {
      gsap.to(node, {
        scale: 1.45,
        duration: 0.3,
        ease: 'back.out(2)',
        transformOrigin: 'center center',
      });
    }

    return () => {
      if (node) {
        gsap.to(node, {
          scale: 1,
          duration: 0.25,
          ease: 'power2.out',
          transformOrigin: 'center center',
        });
      }
    };
  }, [hoveredSenseIndex]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-[340px] max-h-[340px] filter drop-shadow-[0_0_24px_rgba(0,229,255,0.15)]"
        aria-hidden="true"
      >
        <defs>
          {HUMAN_SENSES.map((s) => (
            <radialGradient key={`rg-${s.id}`} id={`orb-glow-${s.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={`rgb(${s.color})`} stopOpacity="1" />
              <stop offset="50%" stopColor={`rgb(${s.color})`} stopOpacity="0.4" />
              <stop offset="100%" stopColor={`rgb(${s.color})`} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id="human-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#00E5FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sweep-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Concentric biological radar rings */}
        {[0.24, 0.48, 0.74, 1.0].map((scale, i) => (
          <circle
            key={i}
            ref={(el) => { ringRefs.current[i] = el; }}
            cx={CENTER}
            cy={CENTER}
            r={ORB_RADIUS * scale}
            stroke={i === 3 ? "rgba(0, 229, 255, 0.25)" : "rgba(0, 229, 255, 0.1)"}
            strokeWidth={i === 3 ? "1.5" : "1"}
            strokeDasharray={i % 2 === 0 ? "4 6" : "none"}
            opacity="0"
          />
        ))}

        {/* Continuous rotating radar scanner sweep */}
        <line
          ref={sweepRef}
          x1={CENTER}
          y1={CENTER}
          x2={CENTER}
          y2={CENTER - ORB_RADIUS}
          stroke="url(#sweep-line-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Core Instinct Hub */}
        <g ref={coreRef} className="cursor-pointer" onClick={() => onSenseSelect?.(5)}>
          <circle cx={CENTER} cy={CENTER} r={32} fill="url(#human-core-glow)" />
          <circle cx={CENTER} cy={CENTER} r={7} fill="#00E5FF" className="animate-pulse" />
          <circle cx={CENTER} cy={CENTER} r={3} fill="#FFFFFF" />
        </g>

        {/* Neural Synapse Lines */}
        {HUMAN_SENSES.map((s, i) => {
          const pos = polarToXY(s.angle, ORB_RADIUS, CENTER, CENTER);
          const isHovered = hoveredSenseIndex === i;
          return (
            <line
              key={`line-${s.id}`}
              ref={(el) => { lineRefs.current[i] = el; }}
              x1={CENTER}
              y1={CENTER}
              x2={pos.x}
              y2={pos.y}
              stroke={isHovered ? `rgb(${s.color})` : `rgba(${s.color}, 0.35)`}
              strokeWidth={isHovered ? 2 : 1}
              className="transition-colors duration-300"
            />
          );
        })}

        {/* 6 Human Sense Nodes */}
        {HUMAN_SENSES.map((s, i) => {
          const pos = polarToXY(s.angle, ORB_RADIUS, CENTER, CENTER);
          const isHovered = hoveredSenseIndex === i;
          return (
            <g
              key={`node-${s.id}`}
              ref={(el) => { nodeRefs.current[i] = el; }}
              transform={`translate(${pos.x}, ${pos.y})`}
              opacity="0"
              className="cursor-pointer group"
              onClick={() => onSenseSelect?.(i)}
            >
              {/* Pulsing ring aura */}
              <circle
                cx="0"
                cy="0"
                r="16"
                fill="none"
                stroke={`rgba(${s.color}, ${isHovered ? 0.8 : 0.4})`}
                strokeWidth="1.2"
                className="animate-ping"
                style={{ animationDuration: `${2.2 + i * 0.4}s` }}
              />

              {/* Glowing halo */}
              <circle cx="0" cy="0" r={isHovered ? 24 : 18} fill={`url(#orb-glow-${s.id})`} />

              {/* Main sense bead */}
              <circle
                cx="0"
                cy="0"
                r={isHovered ? 7 : 5.5}
                fill={`rgb(${s.color})`}
                className="transition-all duration-300"
              />
              <circle cx="0" cy="0" r={isHovered ? 3.5 : 2.5} fill="#FFFFFF" />

              {/* Sense Title Label Badge */}
              <text
                x="0"
                y="-13"
                textAnchor="middle"
                fontSize="8.5"
                fontFamily="sans-serif"
                fontWeight="600"
                fill={isHovered ? "#FFFFFF" : `rgba(${s.color}, 0.85)`}
                letterSpacing="0.06em"
                className="transition-colors duration-200"
              >
                {s.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
