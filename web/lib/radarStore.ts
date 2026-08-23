"use client";

import { create } from "zustand";

type Severity = "INFO" | "WARNING" | "CRITICAL";

export interface Alert {
  id: number;
  collectorId: string;
  severity: Severity;
  message: string;
  draftScript?: string;
  positionA?: string;
  positionB?: string;
  category: string;
  createdAt: string;
}

interface RadarState {
  selectedAlert: Alert | null;
  openAlert: (a: Alert) => void;
  closeAlert: () => void;
  flashMessage: string | null;
  flash: (msg: string) => void;
}

export const useRadarStore = create<RadarState>()((set) => ({
  selectedAlert: null,
  openAlert: (a) => set({ selectedAlert: a }),
  closeAlert: () => set({ selectedAlert: null }),
  flashMessage: null,
  flash: (msg) => {
    set({ flashMessage: msg });
    setTimeout(() => set({ flashMessage: null }), 3500);
  },
}));
