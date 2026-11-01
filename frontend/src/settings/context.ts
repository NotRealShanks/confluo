import { createContext } from "react";
import {
  DEFAULT_SETTINGS,
  type IdeSettings,
  type ResolvedTheme,
} from "./types";

export interface SettingsContextValue {
  settings: IdeSettings;
  resolvedTheme: ResolvedTheme;
  resolvedReducedMotion: boolean;
  monacoTheme: string;
  updateSetting: <K extends keyof IdeSettings>(key: K, value: IdeSettings[K]) => void;
  updateSettings: (partial: Partial<IdeSettings>) => void;
  resetSettings: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

export const fallbackSettingsValue: SettingsContextValue = {
  settings: DEFAULT_SETTINGS,
  resolvedTheme: "light",
  resolvedReducedMotion: false,
  monacoTheme: "vs",
  updateSetting: () => {},
  updateSettings: () => {},
  resetSettings: () => {},
  isSettingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
  toggleSettings: () => {},
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

