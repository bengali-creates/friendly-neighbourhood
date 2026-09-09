'use client';

import React from 'react';

export function CircuitTraceLeft({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id="circuit-grad-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.5" />
          <stop offset="80%" stopColor="#00E5FF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Main Bus Traces */}
      <path
        d="M 20 50 L 120 50 L 160 90 L 160 220 L 220 280 L 220 480 L 280 540 L 340 540"
        stroke="url(#circuit-grad-left)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <path
        d="M 40 120 L 90 120 L 130 160 L 130 350 L 190 410 L 190 560"
        stroke="rgba(0, 229, 255, 0.2)"
        strokeWidth="1"
      />
      <path
        d="M 80 20 L 80 80 L 40 120"
        stroke="rgba(224, 35, 28, 0.3)"
        strokeWidth="1"
      />

      {/* Surface Mount Pads & IC junctions */}
      <rect x="156" y="86" width="8" height="8" fill="#00E5FF" rx="1" />
      <rect x="216" y="276" width="8" height="8" fill="#00E5FF" rx="1" />
      <circle cx="120" cy="50" r="3" fill="#E0231C" />
      <circle cx="280" cy="540" r="3.5" fill="#00E5FF" className="animate-ping" />

      {/* Step Pinouts */}
      <text x="175" y="93" fill="rgba(0, 229, 255, 0.5)" fontSize="8" fontFamily="monospace">
        BUS_01: RESILIENT_DISPATCH
      </text>
      <text x="235" y="283" fill="rgba(0, 229, 255, 0.5)" fontSize="8" fontFamily="monospace">
        BUS_02: AI_INFERENCE_PIPELINE
      </text>
    </svg>
  );
}

export function CircuitTraceRight({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id="circuit-grad-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0231C" stopOpacity="0.45" />
          <stop offset="80%" stopColor="#E0231C" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#E0231C" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d="M 340 80 L 260 80 L 200 140 L 200 320 L 140 380 L 140 520 L 60 600"
        stroke="url(#circuit-grad-right)"
        strokeWidth="1.5"
      />
      <path
        d="M 300 200 L 240 260 L 240 440 L 180 500 L 180 580"
        stroke="rgba(224, 35, 28, 0.2)"
        strokeWidth="1"
        strokeDasharray="6 3"
      />

      <circle cx="200" cy="140" r="3.5" fill="#E0231C" />
      <circle cx="140" cy="380" r="3" fill="#00E5FF" />
      <rect x="196" y="316" width="8" height="8" fill="#E0231C" rx="1" />

      <text x="70" y="375" fill="rgba(224, 35, 28, 0.6)" fontSize="8" fontFamily="monospace">
        STAGE_03 // AUTO_RELOAD
      </text>
    </svg>
  );
}
