"use client";

import React from "react";
import { motion } from "framer-motion";

interface WebShooterArrivalProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "left" | "right";
  className?: string;
}

export function WebShooterArrival({
  children,
  delay = 0,
  direction = "left",
  className = "",
}: WebShooterArrivalProps) {
  const isLeft = direction === "left";

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute -top-10 inset-x-0 h-16 w-full pointer-events-none z-30 overflow-visible"
        fill="none"
      >
        <motion.path
          d={
            isLeft
              ? "M 0 -30 C 80 0, 160 10, 240 45"
              : "M 100% -30 C calc(100% - 80px) 0, calc(100% - 160px) 10, calc(100% - 240px) 45"
          }
          stroke="#00D4FF"
          strokeWidth="3"
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 1 }}
          animate={{ pathLength: 1, opacity: [1, 1, 0] }}
          transition={{ duration: 0.25, delay, ease: "easeOut" }}
        />
        <motion.circle
          cx={isLeft ? "240" : "80%"}
          cy="45"
          r="6"
          fill="#FF2E63"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.8, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 0.3, delay: delay + 0.15 }}
        />
      </svg>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: [0.92, 1.03, 1], y: 0 }}
        transition={{
          duration: 0.35,
          delay: delay + 0.08,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
