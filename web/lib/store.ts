import { useThemeStore } from "./themeStore";
import { useRadarStore } from "./radarStore";
import { useAgentStore } from "./agentStore";

export { useThemeStore } from "./themeStore";
export { useRadarStore } from "./radarStore";
export { useAgentStore } from "./agentStore";

  
export const useStore = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const { selectedAlert, openAlert, closeAlert, flashMessage, flash } = useRadarStore();
  const { agentStatus, setAgentStatus, agentLog, pushLog, clearLog } = useAgentStore();

  return {
    theme,
    toggleTheme,
    setTheme,
    selectedAlert,
    openAlert,
    closeAlert,
    flashMessage,
    flash,
    agentStatus,
    setAgentStatus,
    agentLog,
    pushLog,
    clearLog,
    activeView: "dashboard" as const,
    setView: (_: string) => {},
  };
};

