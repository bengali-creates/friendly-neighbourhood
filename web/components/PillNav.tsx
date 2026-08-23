"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useStore } from "@/lib/store";

export type PillNavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel?: string;
};

export interface PillNavProps {
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  onItemClick?: (index: number, item: PillNavItem) => void;
  orientation?: "vertical" | "horizontal";
}

export default function PillNav({
  items,
  activeHref,
  className = "",
  ease = "power3.easeOut",
  onItemClick,
  orientation = "vertical",
}: PillNavProps) {
  const { theme } = useStore();
  const isDark = theme === "dark";

  // Dynamic comic theme color tokens based on active dark/light theme mode
  const baseColor = isDark ? "#141026" : "#FFFFFF";
  const pillColor = isDark ? "#0B0714" : "#F4EBD9";
  const textColor = isDark ? "#EDEAE0" : "#0B0714";
  const hoveredPillTextColor = isDark ? "#FFFFFF" : "#0B0714";
  const accentColor = "#FF2E63";

  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);

  const activeIndex = items.findIndex((item) => item.href === activeHref);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta =
          Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        });

        const label = pill.querySelector<HTMLElement>(".pill-label");
        const white = pill.querySelector<HTMLElement>(".pill-label-hover");

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(
          circle,
          {
            scale: 1.25,
            xPercent: -50,
            duration: 1.8,
            ease,
            overwrite: "auto",
          },
          0,
        );

        if (label) {
          tl.to(
            label,
            { y: -(h + 8), duration: 1.8, ease, overwrite: "auto" },
            0,
          );
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 80), opacity: 0 });
          tl.to(
            white,
            { y: 0, opacity: 1, duration: 1.8, ease, overwrite: "auto" },
            0,
          );
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    if (document.fonts) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    return () => window.removeEventListener("resize", onResize);
  }, [items, ease, isDark]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.25,
      ease,
      overwrite: "auto",
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: "auto",
    });
  };

  const cssVars = {
    "--base": baseColor,
    "--pill-bg": pillColor,
    "--hover-text": hoveredPillTextColor,
    "--pill-text": textColor,
    "--accent": accentColor,
    "--nav-h": "44px",
    "--pill-pad-x": "12px",
    "--pill-gap": "6px",
  } as React.CSSProperties;

  return (
    <nav className={`w-full ${className}`} aria-label="Primary" style={cssVars}>
      <div
        className={`relative items-stretch rounded-lg p-2.5 border-3 border-black ${
          isDark
            ? "bg-[#141026] text-[#EDEAE0] shadow-[6px_6px_0_#000000]"
            : "bg-white text-[#0B0714] shadow-[6px_6px_0_#0B0714]"
        }`}
      >
        <ul
          role="menubar"
          className={`list-none m-0 p-0 flex ${
            orientation === "vertical"
              ? "flex-col gap-2 w-full"
              : "flex-row gap-2.5 items-center"
          }`}
        >
          {items.map((item, i) => {
            const isActive = activeIndex === i;
            const Icon = item.icon;

            const pillStyle: React.CSSProperties = {
              background: isActive ? accentColor : "var(--pill-bg)",
              color: isActive ? "#FFFFFF" : "var(--pill-text)",
              paddingLeft: "var(--pill-pad-x)",
              paddingRight: "var(--pill-pad-x)",
            };

            return (
              <li key={item.href} role="none" className="flex w-full h-[44px]">
                <button
                  role="menuitem"
                  onClick={() => onItemClick?.(i, item)}
                  onMouseEnter={() => handleEnter(i)}
                  onMouseLeave={() => handleLeave(i)}
                  className={`relative overflow-hidden inline-flex items-center justify-between w-full h-full rounded-md border-2 border-black box-border font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "shadow-[3px_3px_0_#000000] comic-panel-notched"
                      : "shadow-[2px_2px_0_#000000] hover:-translate-y-0.5"
                  }`}
                  style={pillStyle}
                >
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: accentColor,
                      willChange: "transform",
                    }}
                    aria-hidden="true"
                    ref={(el) => {
                      circleRefs.current[i] = el;
                    }}
                  />

                  <span className="label-stack relative flex items-center justify-between w-full z-[2] px-1">
                    <span className="pill-label relative z-[2] inline-flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-['Bangers'] text-sm tracking-wider text-[var(--sv-yellow)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-['Archivo_Black'] text-[11px] truncate">
                        {item.label}
                      </span>
                    </span>

                    <span
                      className="pill-label-hover absolute left-1 top-0 z-[3] inline-flex items-center gap-2.5"
                      style={{
                        color: "var(--hover-text)",
                        willChange: "transform, opacity",
                      }}
                      aria-hidden="true"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-['Bangers'] text-sm tracking-wider text-white">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-['Archivo_Black'] text-[11px] truncate">
                        {item.label}
                      </span>
                    </span>
                  </span>

                  {isActive && (
                    <span
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-[4] bg-[#FFD400] border border-black"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
