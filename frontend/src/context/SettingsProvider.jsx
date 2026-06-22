import { useCallback, useEffect, useMemo, useState } from "react";
import { SettingsContext } from "./SettingsContext";
import {
  DEFAULT_SETTINGS,
  applySettingsToDocument,
  loadSettings,
  resolveTheme,
  saveSettings,
} from "../utils/settingsDefaults";

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(loadSettings);
  const [systemTick, setSystemTick] = useState(0);

  const resolvedTheme = useMemo(
    () => resolveTheme(settings.themeMode),
    // systemTick forces re-resolve when OS theme changes in "system" mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.themeMode, systemTick]
  );

  useEffect(() => {
    applySettingsToDocument(settings, resolvedTheme);
    saveSettings(settings);
  }, [settings, resolvedTheme]);

  useEffect(() => {
    if (settings.themeMode !== "system") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTick((n) => n + 1);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings.themeMode]);

  const updateSettings = useCallback((patch) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
  }, []);

  const setThemeMode = useCallback((themeMode) => {
    setSettingsState((prev) => ({ ...prev, themeMode }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettingsState((prev) => {
      const current = resolveTheme(prev.themeMode);
      return { ...prev, themeMode: current === "dark" ? "light" : "dark" };
    });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
      theme: resolvedTheme,
      themeMode: settings.themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [settings, updateSettings, resetSettings, resolvedTheme, setThemeMode, toggleTheme]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}
