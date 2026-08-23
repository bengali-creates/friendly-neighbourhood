"use client";

import React from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface ScraperNarrativeProps {
  progressList: MotionValue<number>[];
}

const SERVICES = [
  {
    name: "Spotify",
    logo: "🎵",
    status: ["SCANNING TOS...", "⚠ PRICE HIKE +$1.00", "FLAGGED"],
  },
  {
    name: "Adobe",
    logo: "🎨",
    status: ["SCRAPING POLICY...", "⚠ AI TRAINING CLAUSE", "CRITICAL DIFF"],
  },
  {
    name: "Instagram",
    logo: "📸",
    status: ["PARSING DOM...", "⚠ DATA SHARING DISCLOSED", "MONITORED"],
  },
  {
    name: "Amazon",
    logo: "📦",
    status: ["RECALL MATCH...", "⚠ POWER BANK FIRE HAZARD", "RECALLED"],
  },
];

export function ScraperNarrativeBackground({
  progressList,
}: ScraperNarrativeProps) {
  // Sync active step to progress values (0 to 3)
  const p0 = progressList[0] || new MotionValue(0);
  const p1 = progressList[1] || new MotionValue(0);
  const p2 = progressList[2] || new MotionValue(0);
  const p3 = progressList[3] || new MotionValue(0);

  const opacity0 = useTransform(p0, [0.1, 0.4, 0.9], [0.3, 1, 0.3]);
  const opacity1 = useTransform(p1, [0.1, 0.4, 0.9], [0.3, 1, 0.3]);
  const opacity2 = useTransform(p2, [0.1, 0.4, 0.9], [0.3, 1, 0.3]);
  const opacity3 = useTransform(p3, [0.1, 0.4, 0.9], [0.3, 1, 0.3]);

  const opacities = [opacity0, opacity1, opacity2, opacity3];

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
      <svg className="absolute inset-0 w-full h-full" fill="none">
        <path
          d="M 10% 200 C 30% 400, 70% 600, 90% 800 C 70% 1000, 30% 1200, 10% 1400"
          stroke="#111111"
          strokeWidth="2"
          strokeDasharray="4 6"
          opacity="0.25"
        />
      </svg>

      {SERVICES.map((srv, idx) => {
        const yPositions = [
          "top-[220px] left-[6%]",
          "top-[620px] right-[6%]",
          "top-[1020px] left-[6%]",
          "top-[1420px] right-[6%]",
        ];
        return (
          <motion.div
            key={idx}
            style={{ opacity: opacities[idx] }}
            className={`absolute ${yPositions[idx]} flex items-center gap-2.5 transition-all`}
          >
            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#111111] shadow-[2.5px_2.5px_0_#111111] flex items-center justify-center text-lg">
              {srv.logo}
            </div>

            <div className="bg-[#FFD400] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0_#111111] px-2.5 py-1 text-[10px] font-['Bangers'] tracking-wider uppercase">
              <span className="block font-sans font-bold text-[9px] text-[#E8194B] leading-none mb-0.5">
                {srv.name}
              </span>
              {srv.status[1]}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
