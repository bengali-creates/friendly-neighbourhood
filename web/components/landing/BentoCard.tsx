'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from '@/lib/gsap';

export interface BentoCardProps {
  title: string;
  subtitle?: string;
  tag?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
  accentColor?: 'signal' | 'vermilion' | 'ember' | 'bone';
  // React Bits MagicBento capabilities
  enableStars?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  particleCount?: number;
  glowColor?: string;
  disableAnimations?: boolean;
}

const DEFAULT_PARTICLE_COUNT = 10;

const createParticleElement = (x: number, y: number, colorRgb: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = 'magic-particle';
  el.style.cssText = `
    position: absolute;
    width: 3.5px;
    height: 3.5px;
    border-radius: 50%;
    background: rgba(${colorRgb}, 1);
    box-shadow: 0 0 8px rgba(${colorRgb}, 0.8), 0 0 16px rgba(${colorRgb}, 0.4);
    pointer-events: none;
    z-index: 25;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

export function BentoCard({
  title,
  subtitle,
  tag,
  badge,
  children,
  className = '',
  accentColor = 'signal',
  enableStars = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  particleCount = DEFAULT_PARTICLE_COUNT,
  disableAnimations = false,
}: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLDivElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 });

  const rgbMap: Record<string, string> = {
    signal: '0, 229, 255',
    vermilion: '224, 35, 28',
    ember: '255, 107, 43',
    bone: '223, 231, 224',
  };

  const activeRgb = rgbMap[accentColor] || rgbMap.signal;

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, activeRgb)
    );
    particlesInitialized.current = true;
  }, [particleCount, activeRgb]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach((p) => {
      gsap.to(p, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          p.parentNode?.removeChild(p);
        },
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current || !enableStars) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true) as HTMLDivElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 0.9, duration: 0.35, ease: 'back.out(1.7)' }
        );

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        });

        gsap.to(clone, {
          opacity: 0.2,
          duration: 1.4,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true,
        });
      }, index * 120);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles, enableStars]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      setGlowPos((prev) => ({ ...prev, opacity: 1 }));
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      setGlowPos((prev) => ({ ...prev, opacity: 0 }));
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.35,
          ease: 'power2.out',
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.35,
          ease: 'power2.out',
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setGlowPos({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 1,
      });

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.15,
          ease: 'power2.out',
          transformPerspective: 1000,
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.035;
        const magnetY = (y - centerY) * 0.035;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.25,
          ease: 'power2.out',
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${activeRgb}, 0.45) 0%, rgba(${activeRgb}, 0.2) 35%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 40;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.75,
          ease: 'power2.out',
          onComplete: () => ripple.remove(),
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    disableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    activeRgb,
  ]);

  const borderAccentMap: Record<string, string> = {
    signal: 'border-[var(--signal)]/30 hover:border-[var(--signal)]/80 hover:shadow-[0_0_30px_rgba(0,229,255,0.25)]',
    vermilion: 'border-[var(--vermilion)]/30 hover:border-[var(--vermilion)]/80 hover:shadow-[0_0_30px_rgba(224,35,28,0.25)]',
    ember: 'border-[var(--ember)]/30 hover:border-[var(--ember)]/80 hover:shadow-[0_0_30px_rgba(255,107,43,0.25)]',
    bone: 'border-[var(--line-strong)] hover:border-[var(--bone)]/60 hover:shadow-[0_0_30px_rgba(223,231,224,0.15)]',
  };

  return (
    <div
      ref={cardRef}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#110c1d]/95 to-[#07050c]/98 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 ease-out ${borderAccentMap[accentColor] || borderAccentMap.signal} ${className}`}
    >
      {/* Dynamic Cursor-Tracking Border & Surface Glow (MagicBento) */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 z-10"
        style={{
          opacity: glowPos.opacity,
          background: `radial-gradient(360px circle at ${glowPos.x}% ${glowPos.y}%, rgba(${activeRgb}, 0.18), transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Subtle Grid / Texture Backing */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02),transparent_60%)]" />

      {/* Card Header & Tags */}
      <div className="relative z-20 flex items-start justify-between gap-4 mb-4">
        <div>
          {tag && (
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--bone-muted)] mb-1">
              {tag}
            </div>
          )}
          <h3 className="text-lg font-semibold tracking-tight text-[var(--bone)] group-hover:text-white transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--bone-muted)] mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {badge && (
          <span className="shrink-0 rounded-full border border-[var(--line-soft)] bg-[#07050c]/80 px-2.5 py-1 text-[9px] font-mono text-[var(--bone-muted)] group-hover:border-[var(--line-strong)] transition-colors">
            {badge}
          </span>
        )}
      </div>

      {/* Interactive Body Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
}

