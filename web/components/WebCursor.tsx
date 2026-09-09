"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "@/lib/gsap";

interface BreakParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
}

interface MiningImpact {
  id: number;
  x: number;
  y: number;
}

export function WebCursor() {
  const pickaxeRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -200, y: -200 });
  const [mounted, setMounted] = useState(false);

  const [particles, setParticles] = useState<BreakParticle[]>([]);
  const [impacts, setImpacts] = useState<MiningImpact[]>([]);

  useEffect(() => {
    setMounted(true);

    const onMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (pickaxeRef.current) {
        // Direct translate transform without waiting for animation frame lag
        pickaxeRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
      const impactId = Date.now();

      // Mining swing animation:
      if (pickaxeRef.current) {
        const sprite = pickaxeRef.current.querySelector(".pickaxe-sprite");
        if (sprite) {
          gsap.timeline()
            .to(sprite, {
              rotate: -55,
              x: -10,
              y: 10,
              duration: 0.07,
              ease: "power2.in",
            })
            .to(sprite, {
              rotate: 22,
              x: 12,
              y: -6,
              duration: 0.12,
              ease: "back.out(2.5)",
            })
            .to(sprite, {
              rotate: 0,
              x: 0,
              y: 0,
              duration: 0.14,
              ease: "power2.out",
            });
        }
      }

      // Add breaking block ring impact at cursor tip
      setImpacts((prev) => [...prev.slice(-3), { id: impactId, x: clickX, y: clickY }]);
      setTimeout(() => {
        setImpacts((prev) => prev.filter((im) => im.id !== impactId));
      }, 500);

      const debrisColors = [
        "#00E5FF",
        "#38BDF8",
        "#854D0E",
        "#E0231C",
        "#DFE7E0",
      ];

      const newParticles: BreakParticle[] = Array.from({ length: 9 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 9 + (Math.random() - 0.5) * 0.6;
        const speed = Math.random() * 45 + 25;
        return {
          id: impactId + i,
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 15,
          size: Math.floor(Math.random() * 4) + 3,
          color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
          rotation: Math.random() * 360,
        };
      });

      setParticles((prev) => [...prev.slice(-24), ...newParticles]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id < impactId || p.id >= impactId + 9));
      }, 650);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 999999 }}
      aria-hidden="true"
    >
      {/* ── Breaking Block Impact Rings ──────────────────────────── */}
      <AnimatePresence>
        {impacts.map((im) => (
          <svg key={im.id} className="absolute inset-0 w-full h-full pointer-events-none">
            <motion.circle
              cx={im.x}
              cy={im.y}
              r={14}
              stroke="#00E5FF"
              strokeWidth={2}
              strokeDasharray="4 3"
              fill="none"
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
            <motion.line
              x1={im.x - 12}
              y1={im.y}
              x2={im.x + 12}
              y2={im.y}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              initial={{ opacity: 1, scale: 0 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.25 }}
            />
            <motion.line
              x1={im.x}
              y1={im.y - 12}
              x2={im.x}
              y2={im.y + 12}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              initial={{ opacity: 1, scale: 0 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.25 }}
            />
          </svg>
        ))}
      </AnimatePresence>

      {/* ── Breaking Block Debris Particles ─────────────────── */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: p.x,
              y: p.y,
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              x: p.x + p.vx,
              y: p.y + p.vy,
              opacity: 0,
              scale: 0.3,
              rotate: p.rotation + 180,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 4px ${p.color}`,
              pointerEvents: "none",
            }}
          />
        ))}
      </AnimatePresence>

      {/* ── Minecraft Diamond Pickaxe Cursor Sprite ─────────────────── */}
      <div
        ref={pickaxeRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          pointerEvents: "none",
          willChange: "transform",
          transform: "translate3d(-200px, -200px, 0)",
        }}
      >
        <div
          className="pickaxe-sprite"
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "top left",
            filter: "drop-shadow(2px 3px 4px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 6px rgba(0, 229, 255, 0.4))",
          }}
        >
          <img
            src="/pickaxe.png"
            alt="Pickaxe Cursor"
            style={{
              width: "100%",
              height: "100%",
              imageRendering: "pixelated",
              display: "block",
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
