"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(8,6,13,0.85)] backdrop-blur-md border-b border-[rgba(223,231,224,0.12)] py-3.5 shadow-2xl"
          : "bg-transparent py-5 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Logo / Signal Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 rounded-full border border-[rgba(223,231,224,0.2)] flex items-center justify-center bg-[rgba(14,12,22,0.8)] group-hover:border-[var(--vermilion)] transition-colors">
            <span className="w-2 h-2 rounded-full bg-[var(--vermilion)] animate-pulse" />
            <span className="absolute inset-0 rounded-full border border-[var(--vermilion)] opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wider text-[var(--bone)] uppercase font-mono-telemetry">
              Spider-Sense <span className="text-[var(--vermilion)] text-xs">AI</span>
            </span>
            <span className="text-[10px] tracking-widest text-[var(--muted)] uppercase font-mono-telemetry hidden sm:inline-block">
              In-House Playwright Engine
            </span>
          </div>
        </Link>

        {/* Navigation Anchors */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono-telemetry text-[var(--bone-dim)]">
          <a
            href="#hero"
            className="hover:text-[var(--bone)] transition-colors flex items-center gap-1.5"
          >
            <span className="text-[var(--muted)]">01</span> Signal
          </a>
          <a
            href="#scanner"
            className="hover:text-[var(--bone)] transition-colors flex items-center gap-1.5"
          >
            <span className="text-[var(--muted)]">02</span> Threat Layer
          </a>
          <a
            href="#pipeline"
            className="hover:text-[var(--bone)] transition-colors flex items-center gap-1.5"
          >
            <span className="text-[var(--muted)]">03</span> Engine
          </a>
          <a
            href="#telemetry"
            className="hover:text-[var(--bone)] transition-colors flex items-center gap-1.5"
          >
            <span className="text-[var(--muted)]">04</span> Radar Grid
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:inline-block text-xs font-mono-telemetry text-[var(--muted)] hover:text-[var(--bone)] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="cta-slide px-4 py-2 text-xs font-mono-telemetry tracking-wider uppercase group"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Enter Control Room
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
