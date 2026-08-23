"use client";

import React, { useState, useEffect } from "react";

const SUBHEAD_TEXT = "An autonomous AI radar that watches your stuff and the fine print, so you don't have to.";

export function TypewriterSubhead() {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < SUBHEAD_TEXT.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + SUBHEAD_TEXT[index]);
        setIndex((prev) => prev + 1);
      }, 35);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  return (
    <p className="font-sans text-base md:text-xl font-semibold text-[#111111] leading-relaxed max-w-xl min-h-[3.5rem]">
      {displayedText}
      <span className="inline-block w-2 h-5 ml-1 bg-[#E8194B] animate-pulse align-middle" />
    </p>
  );
}
