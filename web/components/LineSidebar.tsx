"use client";

import { useRef, useState, useCallback, useEffect, type CSSProperties } from "react";

type Falloff = "linear" | "smooth" | "sharp";

export interface LineSidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface LineSidebarProps {
  items: LineSidebarItem[];
  activeHref?: string;
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  onItemClick?: (index: number, item: LineSidebarItem) => void;
  className?: string;
}

const FALLOFF_CURVES: Record<Falloff, (p: number) => number> = {
  linear: (p) => p,
  smooth: (p) => p * p * (3 - 2 * p),
  sharp: (p) => p * p * p,
};

export default function LineSidebar({
  items,
  activeHref,
  accentColor = "#FF2E63",
  textColor = "#EDEAE0",
  markerColor = "#00E5FF",
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 30,
  falloff = "smooth",
  markerLength = 60,
  markerGap = 12,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 20,
  fontSize = 1.05,
  smoothing = 100,
  onItemClick,
  className = "",
}: LineSidebarProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  const activeIndex = items.findIndex((item) => item.href === activeHref);
  const activeRef = useRef<number | null>(activeIndex >= 0 ? activeIndex : 0);
  const smoothingRef = useRef(smoothing);

  activeRef.current = activeIndex >= 0 ? activeIndex : 0;
  smoothingRef.current = smoothing;

  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingRef.current, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const itemEls = itemRefs.current;
    for (let i = 0; i < itemEls.length; i++) {
      const el = itemEls[i];
      if (!el) continue;
      const target = Math.max(targetsRef.current[i] || 0, activeRef.current === i ? 1 : 0);
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty("--effect", value.toFixed(4));
      if (!settled) moving = true;
    }

    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const pointerY = e.clientY - rect.top;
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
      const itemEls = itemRefs.current;
      for (let i = 0; i < itemEls.length; i++) {
        const el = itemEls[i];
        if (!el) continue;
        const center = el.offsetTop + el.offsetHeight / 2;
        const distance = Math.abs(pointerY - center);
        targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius));
      }
      startLoop();
    },
    [falloff, proximityRadius, startLoop]
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  const handleClick = useCallback(
    (index: number, item: LineSidebarItem) => {
      onItemClick?.(index, item);
    },
    [onItemClick]
  );

  useEffect(() => {
    startLoop();
  }, [activeIndex, startLoop]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    []
  );

  const tickClass = showMarker
    ? `after:absolute after:left-[calc(-1*var(--marker-length)-var(--marker-gap))] after:top-[calc(100%+var(--item-gap)/2)] after:h-px after:opacity-40 after:content-[''] last:after:content-none after:[background-color:var(--marker-color)] after:[width:calc(var(--marker-length)*var(--tick-scale))] ${
        scaleTick
          ? "after:origin-left after:[transform:translateY(-50%)_scaleX(calc(0.7+var(--effect,0)*0.6))]"
          : "after:-translate-y-1/2"
      }`
    : "";

  return (
    <nav
      className={`relative flex justify-start ${
        showMarker ? "[padding-left:calc(var(--marker-length)+var(--marker-gap))]" : ""
      }${className ? ` ${className}` : ""}`}
      style={
        {
          "--accent-color": accentColor,
          "--text-color": textColor,
          "--marker-color": markerColor,
          "--marker-length": `${markerLength}px`,
          "--marker-gap": `${markerGap}px`,
          "--tick-scale": tickScale,
          "--max-shift": `${maxShift}px`,
          "--item-gap": `${itemGap}px`,
          "--font-size": `${fontSize}rem`,
          "--smoothing": `${smoothing}ms`,
        } as CSSProperties
      }
    >
      <ul
        ref={listRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="m-0 flex list-none flex-col py-2 [gap:var(--item-gap)] w-full"
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;
          return (
            <li
              key={`${item.id}-${index}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              aria-current={isActive ? "true" : undefined}
              onClick={() => handleClick(index, item)}
              className={`relative cursor-pointer py-1.5 px-3 rounded border-2 border-transparent transition-all duration-150 ${
                isActive
                  ? "bg-[#1f1738] border-black shadow-[4px_4px_0_#000000] comic-panel-notched"
                  : "hover:bg-white/5"
              } ${tickClass}`}
            >
              
              {showMarker && (
                <span
                  aria-hidden="true"
                  className="absolute left-[calc(-1*var(--marker-length)-var(--marker-gap))] top-1/2 h-px w-[length:var(--marker-length)] origin-left [background-color:color-mix(in_srgb,var(--accent-color)_calc(var(--effect,0)*100%),var(--marker-color))] [transform:translateY(-50%)_scaleX(calc(0.75+var(--effect,0)*0.55))] transition-transform duration-100 ease-out"
                />
              )}

              
              <span className="relative flex items-center gap-2.5 leading-[1.2] [color:color-mix(in_srgb,var(--accent-color)_calc(var(--effect,0)*100%),var(--text-color))] [font-size:var(--font-size)] [transform:translateX(calc(var(--effect,0)*var(--max-shift)))] transition-colors">
                <span className="[color:color-mix(in_srgb,var(--accent-color)_calc(var(--effect,0)*100%),var(--text-color))] transition-colors">
                  <Icon className="w-4 h-4" />
                </span>

                {showIndex && (
                  <span className="font-['Bangers'] text-[1.15em] tracking-wider text-[var(--sv-yellow)] [opacity:calc(0.65+var(--effect,0)*0.35)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}

                <span className="font-['Archivo_Black'] text-xs uppercase tracking-wider">{item.label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
