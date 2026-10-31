export const PANEL_MIN_HEIGHT = 80;
export const PANEL_DEFAULT_HEIGHT = 180;
export const PANEL_STEP = 16;
export const EDITOR_MIN_HEIGHT = 120;
export const PANEL_MAX_RATIO = 0.7;

export function panelHeightBounds(availableHeight: number): { min: number; max: number } {
  const maxByWorkspace = Math.floor(availableHeight * PANEL_MAX_RATIO);
  const maxByEditor = availableHeight - EDITOR_MIN_HEIGHT;
  const max = Math.max(PANEL_MIN_HEIGHT, Math.min(maxByWorkspace, maxByEditor));
  return {
    min: PANEL_MIN_HEIGHT,
    max: Math.max(PANEL_MIN_HEIGHT, max),
  };
}

export function clampPanelHeight(height: number, availableHeight: number): number {
  const bounds = panelHeightBounds(availableHeight);
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(height)));
}

export function defaultPanelHeight(availableHeight: number): number {
  const target = Math.min(PANEL_DEFAULT_HEIGHT, Math.floor(availableHeight * 0.4));
  return clampPanelHeight(target, availableHeight);
}
