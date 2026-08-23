"use client";

import React from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

interface DiagonalWebShooterProps {
  viewBox: string;
  pathD: string;
  progress: MotionValue<number>;
  strokeColor?: string;
    
  waypointStart: [number, number];
  waypointMid: [number, number];
  waypointEnd: [number, number];
  className?: string;
}

export function DiagonalWebShooter({
  viewBox,
  pathD,
  progress,
  strokeColor = "#00D4FF",
  waypointStart,
  waypointMid,
  waypointEnd,
  className = "",
}: DiagonalWebShooterProps) {
    
  const tipX = useTransform(
    progress,
    [0, 0.5, 1],
    [waypointStart[0], waypointMid[0], waypointEnd[0]]
  );
  const tipY = useTransform(
    progress,
    [0, 0.5, 1],
    [waypointStart[1], waypointMid[1], waypointEnd[1]]
  );
  const tipOpacity = useTransform(progress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  return (
    <svg
      viewBox={viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      className={`pointer-events-none overflow-visible ${className}`}
      fill="none"
    >
      <defs>
        <filter id="tipGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      
      <path d={pathD} stroke="#111111" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

      
      <motion.path
        d={pathD}
        stroke={strokeColor}
        strokeWidth="3.5"
        strokeDasharray="6 4"
        strokeLinecap="round"
        style={{ pathLength: progress }}
      />
      <motion.path
        d={pathD}
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ pathLength: progress }}
      />

      
      <motion.g style={{ opacity: tipOpacity }}>
        <motion.circle cx={tipX} cy={tipY} r="7" fill={strokeColor} filter="url(#tipGlow)" />
        <motion.circle cx={tipX} cy={tipY} r="3" fill="#FFFFFF" />
      </motion.g>
    </svg>
  );
}
