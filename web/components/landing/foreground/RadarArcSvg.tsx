'use client';

import React from 'react';

export function RadarArcSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id="arc-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
          <stop offset="30%" stopColor="#00E5FF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#E0231C" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#00E5FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Sweeping concentric curves */}
      <path d="M 50 220 Q 300 20 550 220" stroke="url(#arc-glow)" strokeWidth="1.5" fill="none" />
      <path d="M 120 220 Q 300 60 480 220" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="1" strokeDasharray="4 6" fill="none" />
      <path d="M 190 220 Q 300 110 410 220" stroke="rgba(224, 35, 28, 0.25)" strokeWidth="1" fill="none" />

      {/* Calibrated Tick Marks */}
      {[-80, -60, -40, -20, 0, 20, 40, 60, 80].map((deg, i) => {
        const x = 300 + deg * 2.5;
        return (
          <g key={i}>
            <line x1={x} y1="210" x2={x} y2="220" stroke="rgba(223, 231, 224, 0.25)" strokeWidth="1" />
            {deg % 40 === 0 && (
              <text x={x} y="202" fill="rgba(0, 229, 255, 0.4)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                {deg > 0 ? `+${deg}°` : `${deg}°`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
