import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  validateSettings,
  type IdeSettings,
  type ResolvedTheme,
} from "./types";
import { SettingsContext, type SettingsContextValue } from "./context";


function loadInitialSettings(): IdeSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      // Migrate from v1 if present, upgrading minimap to true
      const legacyRaw = window.localStorage.getItem("confluo_ide_settings_v1");
      if (legacyRaw) {
        try {
          const legacy = JSON.parse(legacyRaw);
          const migrated = validateSettings({ ...legacy, minimap: true });
          window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        } catch {
          // ignore
        }
      }
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return validateSettings(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getSystemReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<IdeSettings>(loadInitialSettings);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(getSystemReducedMotion);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Synchronize system media query listeners
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    if (themeQuery.addEventListener) {
      themeQuery.addEventListener("change", handleThemeChange);
    } else {
      themeQuery.addListener(handleThemeChange);
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSystemReducedMotion(e.matches);
    };

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionChange);
    } else {
      motionQuery.addListener(handleMotionChange);
    }

    return () => {
      if (themeQuery.removeEventListener) {
        themeQuery.removeEventListener("change", handleThemeChange);
      } else {
        themeQuery.removeListener(handleThemeChange);
      }
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener("change", handleMotionChange);
      } else {
        motionQuery.removeListener(handleMotionChange);
      }
    };
  }, []);

  // Compute resolved values
  const resolvedTheme: ResolvedTheme =
    settings.theme === "system" ? systemTheme : settings.theme;

  const resolvedReducedMotion: boolean =
    settings.reducedMotion === "system"
      ? systemReducedMotion
      : settings.reducedMotion === "reduce";

  const monacoTheme: string = useMemo(() => {
    if (resolvedTheme === "light") {
      return settings.editorTheme === "github-light" || settings.editorTheme === "vs-light"
        ? settings.editorTheme
        : "vs";
    }
    return settings.editorTheme || "vs-dark";
  }, [resolvedTheme, settings.editorTheme]);

  // Apply attributes to <html> DOM node
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    root.setAttribute("data-editor-theme", settings.editorTheme);
    root.classList.toggle("theme-dark", resolvedTheme === "dark");
    root.classList.toggle("theme-light", resolvedTheme === "light");
    root.setAttribute("data-reduced-motion", resolvedReducedMotion ? "true" : "false");
  }, [resolvedTheme, resolvedReducedMotion, settings.editorTheme]);

  // Persist settings to localStorage
  const persistSettings = useCallback((next: IdeSettings) => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Silently ignore storage quota or private-browsing errors
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof IdeSettings>(key: K, value: IdeSettings[K]) => {
      setSettings((prev) => {
        const next = validateSettings({ ...prev, [key]: value });
        persistSettings(next);
        return next;
      });
    },
    [persistSettings],
  );

  const updateSettings = useCallback(
    (partial: Partial<IdeSettings>) => {
      setSettings((prev) => {
        const next = validateSettings({ ...prev, ...partial });
        persistSettings(next);
        return next;
      });
    },
    [persistSettings],
  );

  const resetSettings = useCallback(() => {
    const next = { ...DEFAULT_SETTINGS };
    setSettings(next);
    persistSettings(next);
  }, [persistSettings]);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const toggleSettings = useCallback(() => setIsSettingsOpen((open) => !open), []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      resolvedTheme,
      resolvedReducedMotion,
      monacoTheme,
      updateSetting,
      updateSettings,
      resetSettings,
      isSettingsOpen,
      openSettings,
      closeSettings,
      toggleSettings,
    }),
    [
      settings,
      resolvedTheme,
      resolvedReducedMotion,
      monacoTheme,
      updateSetting,
      updateSettings,
      resetSettings,
      isSettingsOpen,
      openSettings,
      closeSettings,
      toggleSettings,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
