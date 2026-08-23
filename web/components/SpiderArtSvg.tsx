"use client";
import React from "react";
import { motion } from "framer-motion";

export function CornerWebArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none opacity-[0.12] ${className}`}
    >
      <path
        d="M 0 0 L 300 0 M 0 0 L 300 45 M 0 0 L 300 95 M 0 0 L 280 180 M 0 0 L 200 250 M 0 0 L 110 290 M 0 0 L 0 300"
        stroke="#111111"
        strokeWidth="1.8"
      />

      <path
        d="M 40 0 Q 38 18 33 38 Q 28 55 18 68 Q 12 76 0 80"
        stroke="#111111"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M 85 0 Q 80 40 70 80 Q 58 115 40 142 Q 25 160 0 170"
        stroke="#111111"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M 140 0 Q 132 65 115 130 Q 95 185 65 225 Q 40 252 0 265"
        stroke="#111111"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M 200 0 Q 190 90 165 180 Q 135 250 90 300"
        stroke="#111111"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M 270 0 Q 255 120 220 235 Q 180 330 130 380"
        stroke="#111111"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}

export function HalftoneRadialBurst({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none ${className}`}
    >
      <defs>
        <radialGradient id="halftoneGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#111111" stopOpacity="0.12" />
          <stop offset="60%" stopColor="#111111" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#111111" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="benDayDots"
          x="0"
          y="0"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="6" cy="6" r="2.2" fill="#111111" fillOpacity="0.10" />
        </pattern>
      </defs>
      <circle cx="200" cy="200" r="190" fill="url(#halftoneGrad)" />
      <circle cx="200" cy="200" r="180" fill="url(#benDayDots)" />
    </svg>
  );
}

export function WebSlingerHeroSvg({
  className = "",
  isClimbing = false,
  isScrolling = false,
}: {
  className?: string;
  isClimbing?: boolean;
  isScrolling?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-start h-full max-h-[640px] w-full ${className}`}
    >
      <svg
        viewBox="0 0 320 600"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="heroShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="6"
              dy="6"
              stdDeviation="0"
              floodColor="#111111"
              floodOpacity="1"
            />
          </filter>
          <radialGradient id="senseBurst" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8194B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E8194B" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d="M 160 -500 L 160 190"
          stroke="#111111"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 160 -500 L 160 190"
          stroke="#00D4FF"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />
        <path
          d="M 160 -500 L 160 190"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <circle cx="160" cy="-350" r="3.5" fill="#111111" />
        <path
          d="M 153 -352 L 167 -348 M 154 -348 L 166 -352"
          stroke="#111111"
          strokeWidth="1.8"
        />
        <circle cx="160" cy="-180" r="3.5" fill="#111111" />
        <path
          d="M 153 -182 L 167 -178 M 154 -178 L 166 -182"
          stroke="#111111"
          strokeWidth="1.8"
        />
        <circle cx="160" cy="50" r="3.5" fill="#111111" />
        <path
          d="M 153 48 L 167 52 M 154 52 L 166 48"
          stroke="#111111"
          strokeWidth="1.8"
        />
        <circle cx="160" cy="110" r="3.5" fill="#111111" />
        <path
          d="M 153 108 L 167 112 M 154 112 L 166 108"
          stroke="#111111"
          strokeWidth="1.8"
        />

        <circle cx="160" cy="385" r="100" fill="url(#senseBurst)" />
        <path
          d="M 100 385 Q 70 385 45 360 M 220 385 Q 250 385 275 360"
          stroke="#E8194B"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 110 405 Q 75 420 50 435 M 210 405 Q 245 420 270 435"
          stroke="#FFD400"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        <g filter="url(#heroShadow)">
          <ellipse
            cx="160"
            cy="188"
            rx="10"
            ry="7"
            fill="#E8194B"
            stroke="#111111"
            strokeWidth="3"
          />
          <path
            d="M 150 188 Q 160 196 170 188"
            stroke="#111111"
            strokeWidth="2.5"
            fill="none"
          />

          <motion.g
            animate={
              isClimbing && isScrolling
                ? { rotate: [-8, 8, -8], y: [0, -4, 0] }
                : { rotate: 0, y: 0 }
            }
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "160px 190px" }}
          >
            <path
              d="M 160 190 L 130 255 Q 118 290 132 315"
              fill="none"
              stroke="#111111"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 160 190 L 130 255 Q 118 290 132 315"
              fill="none"
              stroke="#E8194B"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>

          <motion.g
            animate={
              isClimbing && isScrolling
                ? { rotate: [8, -8, 8], y: [-4, 0, -4] }
                : { rotate: 0, y: 0 }
            }
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "160px 190px" }}
          >
            <path
              d="M 160 190 L 190 255 Q 202 290 188 315"
              fill="none"
              stroke="#111111"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 160 190 L 190 255 Q 202 290 188 315"
              fill="none"
              stroke="#E8194B"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>

          <path
            d="M 130 310 Q 160 288 190 310 L 184 400 Q 160 418 136 400 Z"
            fill="#E8194B"
            stroke="#111111"
            strokeWidth="3.5"
          />

          <path
            d="M 130 315 Q 145 350 136 400 L 126 382 Z"
            fill="#00D4FF"
            stroke="#111111"
            strokeWidth="2.5"
          />
          <path
            d="M 190 315 Q 175 350 184 400 L 194 382 Z"
            fill="#00D4FF"
            stroke="#111111"
            strokeWidth="2.5"
          />

          <path
            d="M 131 330 Q 160 342 189 330 M 132 355 Q 160 368 188 355 M 134 380 Q 160 392 186 380"
            stroke="#111111"
            strokeWidth="1.8"
            fill="none"
          />
          <path
            d="M 160 305 L 160 410 M 145 312 L 143 398 M 175 312 L 177 398"
            stroke="#111111"
            strokeWidth="1.8"
            fill="none"
          />

          <path
            d="M 160 345 L 154 360 L 160 355 L 166 360 Z M 160 355 L 142 338 M 160 355 L 178 338 M 160 357 L 140 372 M 160 357 L 180 372"
            stroke="#111111"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <ellipse
            cx="160"
            cy="435"
            rx="30"
            ry="36"
            fill="#E8194B"
            stroke="#111111"
            strokeWidth="4"
          />
          <path
            d="M 160 399 L 160 471 M 130 435 Q 160 446 190 435"
            stroke="#111111"
            strokeWidth="1.8"
          />

          <path
            d="M 136 423 Q 150 431 155 415 Q 141 411 136 423 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="3.5"
          />
          <path
            d="M 184 423 Q 170 431 165 415 Q 179 411 184 423 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="3.5"
          />

          <motion.g
            animate={
              isClimbing && isScrolling
                ? { rotate: [6, -6, 6], y: [0, 5, 0] }
                : { rotate: 0, y: 0 }
            }
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "136px 400px" }}
          >
            <path
              d="M 136 400 Q 92 372 104 315 Q 126 328 134 362"
              fill="#00D4FF"
              stroke="#111111"
              strokeWidth="3.5"
            />
            <path
              d="M 104 315 Q 82 282 116 270 Q 124 292 126 320"
              fill="#E8194B"
              stroke="#111111"
              strokeWidth="3.5"
            />
          </motion.g>

          <motion.g
            animate={
              isClimbing && isScrolling
                ? { rotate: [-6, 6, -6], y: [5, 0, 5] }
                : { rotate: 0, y: 0 }
            }
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "184px 400px" }}
          >
            <path
              d="M 184 400 Q 228 372 216 315 Q 194 328 186 362"
              fill="#00D4FF"
              stroke="#111111"
              strokeWidth="3.5"
            />
            <path
              d="M 216 315 Q 238 282 204 270 Q 196 292 194 320"
              fill="#E8194B"
              stroke="#111111"
              strokeWidth="3.5"
            />
          </motion.g>
        </g>
      </svg>
    </div>
  );
}
