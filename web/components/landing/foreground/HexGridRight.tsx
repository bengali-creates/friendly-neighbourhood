'use client';

import React from 'react';

export function HexGridRight({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full pointer-events-none ${className}`}
    >
      <defs>
        <pattern id="hex-pattern-right" width="56" height="96" patternUnits="userSpaceOnUse">
          <path
            d="M28 0 L56 16 V48 L28 64 L0 48 V16 Z M28 64 L56 80 V112 L28 128 L0 112 V80 Z"
            stroke="rgba(224, 35, 28, 0.16)"
            strokeWidth="1"
            fill="none"
          />
        </pattern>
        <linearGradient id="hex-fade-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0231C" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#E0231C" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#E0231C" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="320" height="500" fill="url(#hex-pattern-right)" mask="url(#hex-mask-right)" />

      <mask id="hex-mask-right">
        <rect width="320" height="500" fill="url(#hex-fade-right)" />
      </mask>

      {/* Warning crosshair & telemetry */}
      <circle cx="230" cy="140" r="18" stroke="rgba(224, 35, 28, 0.4)" strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="230" cy="140" r="4" fill="#E0231C" />
      <line x1="205" y1="140" x2="255" y2="140" stroke="rgba(224, 35, 28, 0.5)" strokeWidth="1" />
      <line x1="230" y1="115" x2="230" y2="165" stroke="rgba(224, 35, 28, 0.5)" strokeWidth="1" />

      <text x="180" y="195" fill="rgba(224, 35, 28, 0.6)" fontSize="8" fontFamily="monospace" letterSpacing="0.18em">
        TARGET LOCK // ACQUIRED
      </text>
      <text x="180" y="207" fill="rgba(223, 231, 224, 0.35)" fontSize="7" fontFamily="monospace">
        TRAP_LEVEL: CRITICAL
      </text>
    </svg>
  );
}
