"use client";

import { create } from "zustand";

export type AgentStatus = "idle" | "running" | "healed" | "error";

interface AgentState {
  agentStatus: AgentStatus;
  setAgentStatus: (status: AgentStatus) => void;
  agentLog: string[];
  pushLog: (line: string) => void;
  clearLog: () => void;
}

export const useAgentStore = create<AgentState>()((set) => ({
  agentStatus: "idle",
  setAgentStatus: (agentStatus) => set({ agentStatus }),
  agentLog: [],
  pushLog: (line) => set((state) => ({ agentLog: [...state.agentLog.slice(-49), line] })),
  clearLog: () => set({ agentLog: [] }),
}));
