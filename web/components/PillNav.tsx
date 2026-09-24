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

  // Dynamic theme color tokens based on warm-dark minimalist system
  const baseColor = isDark ? "var(--depth)" : "#FFFFFF";
  const pillColor = "transparent";
  const textColor = isDark ? "var(--ink-secondary)" : "#57534E";
  const hoveredPillTextColor = isDark ? "var(--ink-primary)" : "#1C1917";
  const hoverCircleBg = isDark ? "rgba(30, 26, 39, 0.85)" : "#EFECE6";

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
    "--nav-h": "40px",
    "--pill-pad-x": "12px",
    "--pill-gap": "4px",
  } as React.CSSProperties;

  return (
    <nav className={`w-full ${className}`} aria-label="Primary" style={cssVars}>
      <div
        className="relative items-stretch rounded-[var(--radius-lg)] p-2 border border-[var(--rim)] bg-[var(--depth)] text-[var(--ink-primary)] transition-colors duration-200"
      >
        <ul
          role="menubar"
          className={`list-none m-0 p-0 flex ${
            orientation === "vertical"
              ? "flex-col gap-1.5 w-full"
              : "flex-row gap-2 items-center"
          }`}
        >
          {items.map((item, i) => {
            const isActive = activeIndex === i;
            const Icon = item.icon;

            const pillStyle: React.CSSProperties = {
              paddingLeft: "var(--pill-pad-x)",
              paddingRight: "var(--pill-pad-x)",
            };

            return (
              <li key={item.href} role="none" className="flex w-full h-[40px]">
                <button
                  role="menuitem"
                  onClick={() => onItemClick?.(i, item)}
                  onMouseEnter={() => handleEnter(i)}
                  onMouseLeave={() => handleLeave(i)}
                  className={`group relative overflow-hidden inline-flex items-center justify-between w-full h-full rounded-[var(--radius-sm)] border box-border font-medium text-xs tracking-normal cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "border-[rgba(196,181,253,0.3)] bg-[var(--surface)] text-[var(--ink-primary)] shadow-sm"
                      : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface)]/60"
                  }`}
                  style={pillStyle}
                >
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: hoverCircleBg,
                      willChange: "transform",
                    }}
                    aria-hidden="true"
                    ref={(el) => {
                      circleRefs.current[i] = el;
                    }}
                  />

                  <span className="label-stack relative flex items-center justify-between w-full z-[2] px-1">
                    <span className="pill-label relative z-[2] inline-flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[var(--watchful)]" : "text-[var(--ink-tertiary)] group-hover:text-[var(--ink-secondary)]"}`} />
                      <span className="font-mono text-[10px] text-[var(--ink-tertiary)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-medium truncate">
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
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[var(--watchful)]" : "text-[var(--ink-primary)]"}`} />
                      <span className="font-mono text-[10px] text-[var(--ink-tertiary)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-medium truncate">
                        {item.label}
                      </span>
                    </span>
                  </span>

                  {isActive && (
                    <span
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full z-[4] bg-[var(--watchful)] shadow-[0_0_8px_rgba(196,181,253,0.6)]"
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
