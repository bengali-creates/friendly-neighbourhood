"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  dist: number;
}

interface WebShot {
  id: number;
  x: number;
  y: number;
}

export function WebCursor() {
  const spriteRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);

  const [shots, setShots] = useState<WebShot[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
      
    const loop = () => {
      if (spriteRef.current) {
        spriteRef.current.style.transform = `translate3d(${posRef.current.x - 18}px, ${posRef.current.y - 18}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const onDown = (e: MouseEvent) => {
      const shotId = Date.now();
      const cx = e.clientX;
      const cy = e.clientY;

      setShots((prev) => [...prev.slice(-4), { id: shotId, x: cx, y: cy }]);
      setParticles((prev) => [
        ...prev.slice(-16),
        ...Array.from({ length: 8 }, (_, i) => ({
          id: shotId + i,
          x: cx,
          y: cy,
          angle: (i * 45 * Math.PI) / 180,
          dist: Math.random() * 45 + 25,
        })),
      ]);

      setTimeout(() => {
        setShots((prev) => prev.filter((s) => s.id !== shotId));
      }, 700);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 99999 }}
    >
      {shots.map((shot) => (
        <svg key={shot.id} className="absolute inset-0 w-full h-full">
          <motion.line
            x1={shot.x < window.innerWidth / 2 ? 0 : window.innerWidth}
            y1={shot.y < window.innerHeight / 2 ? 0 : window.innerHeight}
            x2={shot.x}
            y2={shot.y}
            stroke="#00D4FF"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.circle
            cx={shot.x}
            cy={shot.y}
            r="18"
            stroke="#E8194B"
            strokeWidth="2"
            fill="none"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        </svg>
      ))}

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-[#00D4FF] border border-[#111111]"
          initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
          animate={{
            x: p.x + Math.cos(p.angle) * p.dist,
            y: p.y + Math.sin(p.angle) * p.dist,
            opacity: 0,
            scale: 0.2,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      ))}

      <div
        ref={spriteRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          pointerEvents: "none",
          zIndex: 100000,
          willChange: "transform",
          transform: "translate3d(-200px, -200px, 0)",
        }}
      >
        <img
          src="/Screenshot_2026-08-22_214517-removebg-preview.png"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
