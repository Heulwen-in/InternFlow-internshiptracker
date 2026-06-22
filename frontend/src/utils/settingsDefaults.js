export const SETTINGS_STORAGE_KEY = "internflow-settings";

export const DEFAULT_SETTINGS = {
  themeMode: "system",
  density: "regular",
  accentHue: 45,
  defaultAppsView: "table",
  weekStartsOn: 0,
  confirmDelete: true,
  reducedMotion: "system",
  showRejectedInPipeline: true,
};

export const DENSITY_VALUES = {
  compact: 0.88,
  regular: 1,
  comfy: 1.12,
};

export const ACCENT_OPTIONS = [
  { hue: 45, label: "Sienna" },
  { hue: 35, label: "Terracotta" },
  { hue: 150, label: "Forest" },
  { hue: 200, label: "Ocean" },
  { hue: 250, label: "Indigo" },
  { hue: 305, label: "Plum" },
];

export function loadSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
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
  document.documentElement.style.setProperty(
    "--density",
    String(DENSITY_VALUES[settings.density] ?? 1)
  );
  document.documentElement.style.setProperty(
    "--accent-h",
    String(settings.accentHue ?? DEFAULT_SETTINGS.accentHue)
  );

  if (settings.reducedMotion === "reduce") {
    document.documentElement.setAttribute("data-reduced-motion", "reduce");
  } else if (settings.reducedMotion === "normal") {
    document.documentElement.setAttribute("data-reduced-motion", "normal");
  } else {
    document.documentElement.removeAttribute("data-reduced-motion");
  }
}

export function reorderWeekdays(weekStartsOn) {
  const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (weekStartsOn === 1) return [...base.slice(1), base[0]];
  return base;
}
