'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap';

export type CalloutPlacement =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left-center'
  | 'right-center'
  | 'manual';

export interface MarvelDialogueCalloutProps {
  isOpen: boolean;
  placement?: CalloutPlacement;
  title?: string;
  badge?: string;
  accentColor?: 'signal' | 'vermilion' | 'ember' | 'bone';
  children: React.ReactNode;
  delay?: number;
  className?: string;
  // Manual Calibration Options
  offsetX?: number; // e.g., +15, -20 (applied via transform: translate)
  offsetY?: number; // e.g., -10, +25
  top?: string | number; // custom manual coordinate override
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
  width?: string | number; // custom width calibration (e.g., '14rem', 220)
  notchPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none'; // manual tail notch calibration
  style?: React.CSSProperties; // arbitrary inline CSS overrides
}

export function MarvelDialogueCallout({
  isOpen,
  placement = 'top-left',
  title = 'INTEL',
  badge,
  accentColor = 'signal',
  children,
  delay = 0,
  className = '',
  offsetX = 0,
  offsetY = 0,
  top,
  bottom,
  left,
  right,
  width,
  notchPosition,
  style,
}: MarvelDialogueCalloutProps) {
  const calloutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = calloutRef.current;
    if (!el) return;

    if (isOpen) {
      // Marvel 3D Comic Pop Entrance Animation with calibrated offsets
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        {
          opacity: 0,
          scale: 0.5,
          rotateX: 25,
          rotateZ: placement.includes('left') ? -8 : 8,
          x: offsetX,
          y: offsetY + 15,
        },
        {
          opacity: 1,
          scale: 1,
          rotateX: 0,
          rotateZ: 0,
          x: offsetX,
          y: offsetY,
          duration: 0.38,
          delay: delay,
          ease: 'back.out(2.5)',
          display: 'block',
        }
      );
    } else {
      gsap.to(el, {
        opacity: 0,
        scale: 0.75,
        rotateX: -15,
        x: offsetX,
        y: offsetY + 8,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => {
          if (el) el.style.display = 'none';
        },
      });
    }
  }, [isOpen, placement, delay, offsetX, offsetY]);

  const colorStyles = {
    signal: {
      border: 'border-[var(--signal)]/80',
      glow: 'shadow-[0_10px_30px_rgba(0,229,255,0.3)]',
      badgeBg: 'bg-[var(--signal)]/15 text-[var(--signal)] border-[var(--signal)]/40',
      dot: 'bg-[var(--signal)]',
    },
    vermilion: {
      border: 'border-[var(--vermilion)]/80',
      glow: 'shadow-[0_10px_30px_rgba(224,35,28,0.35)]',
      badgeBg: 'bg-[var(--vermilion)]/15 text-[var(--vermilion)] border-[var(--vermilion)]/40',
      dot: 'bg-[var(--vermilion)]',
    },
    ember: {
      border: 'border-[var(--ember)]/80',
      glow: 'shadow-[0_10px_30px_rgba(255,107,43,0.35)]',
      badgeBg: 'bg-[var(--ember)]/15 text-[var(--ember)] border-[var(--ember)]/40',
      dot: 'bg-[var(--ember)]',
    },
    bone: {
      border: 'border-[var(--line-strong)]',
      glow: 'shadow-[0_10px_30px_rgba(0,0,0,0.85)]',
      badgeBg: 'bg-white/10 text-[var(--bone)] border-white/20',
      dot: 'bg-white',
    },
  }[accentColor];

  // Placements kept safely within container bounds or hugging card edges
  const placementClasses: Record<CalloutPlacement, string> = {
    'top-left': 'left-3 -top-14 sm:-top-16',
    'top-right': 'right-3 -top-14 sm:-top-16',
    'bottom-left': 'left-3 -bottom-14 sm:-bottom-16',
    'bottom-right': 'right-3 -bottom-14 sm:-bottom-16',
    'left-center': '-left-2 sm:-left-6 top-1/2 -translate-y-1/2',
    'right-center': '-right-2 sm:-right-6 top-1/2 -translate-y-1/2',
    manual: '',
  };

  // Determine active notch position: manual override takes precedence, otherwise infers from placement
  const activeNotch =
    notchPosition !== undefined
      ? notchPosition
      : placement.startsWith('top')
      ? 'top'
      : placement.startsWith('bottom')
      ? 'bottom'
      : placement === 'left-center'
      ? 'left'
      : placement === 'right-center'
      ? 'right'
      : 'none';

  const containerStyle: React.CSSProperties = {
    display: 'none',
    perspective: 800,
    ...(top !== undefined && { top }),
    ...(bottom !== undefined && { bottom }),
    ...(left !== undefined && { left }),
    ...(right !== undefined && { right }),
    ...(width !== undefined && { width }),
    ...style,
  };

  return (
    <div
      ref={calloutRef}
      style={containerStyle}
      className={`absolute z-50 ${width ? '' : 'w-48 sm:w-56'} pointer-events-none ${placementClasses[placement]} ${className}`}
    >
      {/* 3D COMIC DIALOGUE BOX */}
      <div
        className={`relative rounded-xl border bg-[#0b0816]/98 p-2.5 sm:p-3 backdrop-blur-2xl ${colorStyles.border} ${colorStyles.glow}`}
      >
        {/* Comic Dialogue Header */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--line-soft)] font-mono text-[9px]">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${colorStyles.dot}`} />
            <span className="font-bold tracking-wider text-[var(--bone)] uppercase truncate max-w-[110px]">
              {title}
            </span>
          </div>
          {badge && (
            <span
              className={`px-1.5 py-0.2 rounded border text-[8px] font-semibold tracking-wider ${colorStyles.badgeBg}`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="text-[10px] text-[var(--bone)] leading-relaxed font-sans">{children}</div>

        {/* Comic Decorative Pointer Notch (Auto or Manually Calibrated) */}
        {activeNotch === 'top' && (
          <div className="absolute left-6 -bottom-1.5 w-3 h-3 rotate-45 bg-[#0b0816] border-b border-r border-inherit" />
        )}
        {activeNotch === 'bottom' && (
          <div className="absolute left-6 -top-1.5 w-3 h-3 rotate-45 bg-[#0b0816] border-t border-l border-inherit" />
        )}
        {activeNotch === 'left' && (
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-[#0b0816] border-t border-r border-inherit" />
        )}
        {activeNotch === 'right' && (
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-[#0b0816] border-b border-l border-inherit" />
        )}
      </div>
    </div>
  );
}