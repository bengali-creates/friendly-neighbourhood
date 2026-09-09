'use client';

import React from 'react';

export function PerspectiveGrid({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id="grid-fade-up" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
          <stop offset="60%" stopColor="#00E5FF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#E0231C" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Perspective Transverse lines */}
      {[20, 50, 90, 140, 200, 270].map((y, idx) => (
        <line
          key={idx}
          x1="0"
          y1={y}
          x2="1000"
          y2={y}
          stroke="url(#grid-fade-up)"
          strokeWidth={0.8 + idx * 0.2}
          opacity={0.3 + (idx / 6) * 0.6}
        />
      ))}

      {/* Vanishing point convergence lines to (500, -50) */}
      {[50, 150, 250, 350, 420, 480, 520, 580, 650, 750, 850, 950].map((x, idx) => (
        <line
          key={idx}
          x1="500"
          y1="0"
          x2={x}
          y2="300"
          stroke="url(#grid-fade-up)"
          strokeWidth="1"
          opacity="0.4"
        />
      ))}
    </svg>
  );
}
