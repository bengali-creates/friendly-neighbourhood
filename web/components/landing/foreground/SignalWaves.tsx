'use client';

import React from 'react';

export function SignalWaveLeft({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Sine Wave packet trains */}
      <path
        d="M 10 250 Q 50 180, 90 250 T 170 250 T 250 250 T 330 250"
        stroke="url(#wave-grad-1)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 10 290 Q 60 210, 110 290 T 210 290 T 310 290"
        stroke="rgba(0, 229, 255, 0.2)"
        strokeWidth="1"
        strokeDasharray="2 4"
        fill="none"
      />
      <path
        d="M 10 210 Q 40 160, 70 210 T 130 210 T 190 210 T 250 210"
        stroke="rgba(224, 35, 28, 0.25)"
        strokeWidth="1"
        fill="none"
      />

      {/* Histogram bars */}
      {[20, 50, 90, 45, 110, 80, 140, 60, 30].map((h, i) => (
        <rect
          key={i}
          x={30 + i * 28}
          y={420 - h}
          width="12"
          height={h}
          fill="rgba(0, 229, 255, 0.12)"
          stroke="rgba(0, 229, 255, 0.3)"
          strokeWidth="1"
        />
      ))}

      <text x="30" y="445" fill="rgba(0, 229, 255, 0.4)" fontSize="8" fontFamily="monospace">
        TELEMETRY_SAMPLE_RATE // 120Hz
      </text>
    </svg>
  );
}

export function SignalWaveRight({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id="wave-grad-r" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0231C" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E0231C" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Oscilloscope sweeps */}
      <path
        d="M 330 200 C 270 200, 250 120, 210 120 C 170 120, 150 280, 110 280 C 70 280, 50 200, 10 200"
        stroke="url(#wave-grad-r)"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="210" cy="120" r="3" fill="#E0231C" />
      <circle cx="110" cy="280" r="3" fill="#00E5FF" />

      {/* Frame markers */}
      <line x1="280" y1="40" x2="320" y2="40" stroke="rgba(224, 35, 28, 0.4)" strokeWidth="1" />
      <line x1="320" y1="40" x2="320" y2="80" stroke="rgba(224, 35, 28, 0.4)" strokeWidth="1" />
      <text x="220" y="55" fill="rgba(224, 35, 28, 0.5)" fontSize="8" fontFamily="monospace">
        PEAK_LATENCY: 42ms
      </text>
    </svg>
  );
}
