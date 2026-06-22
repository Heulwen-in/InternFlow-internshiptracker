import { createContext, useContext } from "react";

export const SettingsContext = createContext(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};

export const useTheme = () => {
  const { theme, themeMode, setThemeMode, toggleTheme } = useSettings();
  return {
    theme,
    setTheme: (mode) => setThemeMode(mode),
    toggleTheme,
    themeMode,
  };
};
