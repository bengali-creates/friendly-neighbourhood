'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap';

interface ForegroundPlaneProps {
  id: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

export function ForegroundPlane({
  id,
  leftContent,
  rightContent,
  className = '',
}: ForegroundPlaneProps) {
  const planeRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const plane = planeRef.current;
    if (!plane) return;

    // Triggered when parent section scrolls through viewport
    const triggerEl = document.getElementById(id);
    if (!triggerEl) return;

    const ctx = gsap.context(() => {
      // Entrance & exit timeline linked to triggerEl scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play reverse play reverse',
        },
      });

      if (leftRef.current) {
        tl.fromTo(
          leftRef.current,
          { opacity: 0, y: 60, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
          0
        );
      }

      if (rightRef.current) {
        tl.fromTo(
          rightRef.current,
          { opacity: 0, y: 60, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
          0.1
        );
      }
    });

    return () => ctx.revert();
  }, [id]);

  return (
    <div
      ref={planeRef}
      className={`pointer-events-none absolute inset-0 z-20 flex justify-between items-end overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Left Wing Foreground Asset */}
      <div
        ref={leftRef}
        className="w-[280px] sm:w-[360px] md:w-[420px] max-w-[40vw] h-auto pb-4 pl-2 sm:pl-6 opacity-0"
      >
        {leftContent}
      </div>

      {/* Right Wing Foreground Asset */}
      <div
        ref={rightRef}
        className="w-[280px] sm:w-[360px] md:w-[420px] max-w-[40vw] h-auto pb-4 pr-2 sm:pr-6 opacity-0 flex justify-end"
      >
        {rightContent}
      </div>
    </div>
  );
}
