"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export type AnchorCorner = "top-right" | "top-left" | "bottom-right" | "bottom-left";
export type TriggerType = "click" | "inView";

export interface WebAttachProps {
  children: React.ReactNode;
  trigger?: TriggerType;
  anchorCorner?: AnchorCorner;
  persistent?: boolean;
  active?: boolean;
  className?: string;
  onAttachChange?: (attached: boolean) => void;
}

export function WebAttach({
  children,
  trigger = "click",
  anchorCorner = "top-right",
  persistent = false,
  active = false,
  className = "",
  onAttachChange,
}: WebAttachProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAttached, setIsAttached] = useState(false);
  const [strandPath, setStrandPath] = useState("");
  const [landingPoint, setLandingPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [portalMounted, setPortalMounted] = useState(false);
  const retractTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  const updateWebPath = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let cornerX = rect.right;
    let cornerY = rect.top;

    if (anchorCorner === "top-left") {
      cornerX = rect.left;
      cornerY = rect.top;
    } else if (anchorCorner === "bottom-right") {
      cornerX = rect.right;
      cornerY = rect.bottom;
    } else if (anchorCorner === "bottom-left") {
      cornerX = rect.left;
      cornerY = rect.bottom;
    }

    const startX = Math.max(20, Math.min(window.innerWidth - 20, cornerX + (anchorCorner.includes("right") ? 40 : -40)));
    const startY = -40;

    const controlX = (startX + cornerX) / 2 + (anchorCorner.includes("right") ? 20 : -20);
    const controlY = (startY + cornerY) / 2 - 10;

    setStrandPath(`M ${startX} ${startY} Q ${controlX} ${controlY} ${cornerX} ${cornerY}`);
    setLandingPoint({ x: cornerX, y: cornerY });
  }, [anchorCorner]);

  useEffect(() => {
    if (trigger !== "inView" || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          updateWebPath();
          setIsAttached(true);
          onAttachChange?.(true);
        } else {
          setIsAttached(false);
          onAttachChange?.(false);
        }
      },
      { threshold: 0.15, rootMargin: "0px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [trigger, updateWebPath, onAttachChange]);

  useEffect(() => {
    if (trigger === "click" && persistent) {
      if (active) {
        updateWebPath();
        setIsAttached(true);
      } else {
        setIsAttached(false);
      }
    }
  }, [active, persistent, trigger, updateWebPath]);

  const handleClick = (e: React.MouseEvent) => {
    if (trigger !== "click") return;

    updateWebPath();
    setIsAttached(true);

    if (!persistent) {
      if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
      retractTimerRef.current = setTimeout(() => {
        setIsAttached(false);
      }, 500);
    }
  };

  const portalOverlay = portalMounted && (
    <AnimatePresence>
      {isAttached && strandPath && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
            overflow: "visible",
          }}
        >
          <svg style={{ width: "100%", height: "100%" }} fill="none">
            <motion.path
              d={strandPath}
              stroke="#111111"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
            <motion.path
              d={strandPath}
              stroke="#00D4FF"
              strokeWidth="1.8"
              strokeDasharray="6 4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
            <motion.circle
              cx={landingPoint.x}
              cy={landingPoint.y}
              r="6"
              fill="#FF2E63"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.6, 1], opacity: [0, 1, 0.9] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.circle
              cx={landingPoint.x}
              cy={landingPoint.y}
              r="3"
              fill="#FFFFFF"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            />
          </svg>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`relative ${className}`}
    >
      {typeof document !== "undefined" && createPortal(portalOverlay, document.body)}

      {persistent && isAttached && (
        <span
          className={`absolute z-30 pointer-events-none w-3 h-3 text-[#00D4FF] ${
            anchorCorner === "top-right"
              ? "-top-1.5 -right-1.5"
              : anchorCorner === "top-left"
              ? "-top-1.5 -left-1.5"
              : anchorCorner === "bottom-right"
              ? "-bottom-1.5 -right-1.5"
              : "-bottom-1.5 -left-1.5"
          }`}
        >
          <svg viewBox="0 0 12 12" fill="currentColor">
            <path d="M0 0 L12 0 L12 12 Z" />
          </svg>
        </span>
      )}

      {trigger === "inView" ? (
        <motion.div
          animate={{
            opacity: isAttached ? 1 : 0.2,
            scale: isAttached ? 1 : 0.95,
            y: isAttached ? 0 : 20,
          }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </div>
  );
}
