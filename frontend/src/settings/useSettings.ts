import { useContext } from "react";
import { SettingsContext, fallbackSettingsValue, type SettingsContextValue } from "./context";

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  return context ?? fallbackSettingsValue;
}

