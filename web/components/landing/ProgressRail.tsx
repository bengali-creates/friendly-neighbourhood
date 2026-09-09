"use client";

import React, { useEffect, useState } from "react";

interface Chapter {
  id: string;
  num: string;
  label: string;
}

const chapters: Chapter[] = [
  { id: "hero", num: "01", label: "Signal" },
  { id: "scanner", num: "02", label: "Threat" },
  { id: "pipeline", num: "03", label: "Engine" },
  { id: "telemetry", num: "04", label: "Telemetry" },
  { id: "command-deck", num: "05", label: "Deploy" },
];

export function ProgressRail() {
  const [activeSection, setActiveSection] = useState<string>("hero");

  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "-40% 0px -40% 0px",
      threshold: 0,
    });

    chapters.forEach((ch) => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-5 pointer-events-auto"
      aria-label="Chapter progress rail"
    >
      {chapters.map((ch) => {
        const isActive = activeSection === ch.id;
        return (
          <button
            key={ch.id}
            onClick={() => scrollTo(ch.id)}
            className="group flex items-center gap-3 text-right focus:outline-none py-1"
          >
            <span
              className={`text-[10px] font-mono-telemetry transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                isActive
                  ? "opacity-100 text-[var(--vermilion)] translate-x-0"
                  : "text-[var(--muted)] translate-x-2 group-hover:translate-x-0"
              }`}
            >
              {ch.num} {ch.label}
            </span>

            <div className="relative flex items-center justify-center">
              <span
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "h-6 bg-[var(--vermilion)] shadow-[0_0_12px_var(--vermilion)]"
                    : "h-1.5 bg-[var(--line)] group-hover:bg-[var(--bone)]"
                }`}
              />
            </div>
          </button>
        );
      })}
    </aside>
  );
}
