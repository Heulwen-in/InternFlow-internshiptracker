export const SETTINGS_STORAGE_KEY = "internflow-settings";

export const DEFAULT_SETTINGS = {
  themeMode: "system",
  defaultAppsView: "table",
  weekStartsOn: 0,
  confirmDelete: true,
  showRejectedInPipeline: true,
};

export function loadSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      themeMode: parsed.themeMode ?? DEFAULT_SETTINGS.themeMode,
      defaultAppsView: parsed.defaultAppsView ?? DEFAULT_SETTINGS.defaultAppsView,
      weekStartsOn: parsed.weekStartsOn ?? DEFAULT_SETTINGS.weekStartsOn,
      confirmDelete:
        parsed.confirmDelete ?? DEFAULT_SETTINGS.confirmDelete,
      showRejectedInPipeline:
        parsed.showRejectedInPipeline ?? DEFAULT_SETTINGS.showRejectedInPipeline,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function resolveTheme(themeMode) {
  if (themeMode === "light" || themeMode === "dark") return themeMode;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applySettingsToDocument(settings, resolvedTheme) {
  document.documentElement.setAttribute("data-theme", resolvedTheme);
}

export function reorderWeekdays(weekStartsOn) {
  const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (weekStartsOn === 1) return [...base.slice(1), base[0]];
  return base;
}
