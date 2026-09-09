'use client';

import React from 'react';

export function HexGridLeft({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full pointer-events-none ${className}`}
    >
      <defs>
        <pattern id="hex-pattern-left" width="56" height="96" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
          <path
            d="M28 0 L56 16 V48 L28 64 L0 48 V16 Z M28 64 L56 80 V112 L28 128 L0 112 V80 Z"
            stroke="rgba(0, 229, 255, 0.18)"
            strokeWidth="1"
            fill="none"
          />
        </pattern>
        <linearGradient id="hex-fade-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#00E5FF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="320" height="500" fill="url(#hex-pattern-left)" mask="url(#hex-mask-left)" />

      <mask id="hex-mask-left">
        <rect width="320" height="500" fill="url(#hex-fade-left)" />
      </mask>

      {/* Accent illuminated nodes */}
      <circle cx="56" cy="112" r="3" fill="#00E5FF" className="animate-pulse" />
      <circle cx="112" cy="176" r="2.5" fill="#E0231C" />
      <circle cx="28" cy="256" r="2" fill="#00E5FF" opacity="0.6" />
      <line x1="56" y1="112" x2="112" y2="176" stroke="rgba(0, 229, 255, 0.35)" strokeWidth="1" strokeDasharray="3 3" />

      {/* Coordinate Telemetry stamp */}
      <text x="18" y="32" fill="rgba(0, 229, 255, 0.45)" fontSize="8" fontFamily="monospace" letterSpacing="0.2em">
        HEX_GRID // SECTOR 07-A
      </text>
      <text x="18" y="44" fill="rgba(223, 231, 224, 0.3)" fontSize="7" fontFamily="monospace">
        LAT: 40.7128° N / PULSE: ACTIVE
      </text>
    </svg>
  );
}
