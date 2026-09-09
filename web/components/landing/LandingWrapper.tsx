"use client";

import React, { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

interface LandingWrapperProps {
  children: React.ReactNode;
}

export function LandingWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Refresh all ScrollTrigger instances after DOM elements are fully painted
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timeout);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--ink)] text-[var(--bone)] selection:bg-[var(--vermilion)] selection:text-white">
      {children}
    </div>
  );
}
