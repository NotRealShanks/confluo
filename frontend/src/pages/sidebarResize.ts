export const SIDEBAR_MIN_WIDTH = 190;
export const SIDEBAR_DEFAULT_WIDTH = 260;
export const SIDEBAR_STEP = 16;
export const EDITOR_MIN_WIDTH = 240;

export function sidebarWidthBounds(availableWidth: number): { min: number; max: number } {
  const maxByWorkspace = Math.floor(availableWidth * 0.45);
  const maxByEditor = availableWidth - EDITOR_MIN_WIDTH;
  return {
    min: SIDEBAR_MIN_WIDTH,
    max: Math.max(SIDEBAR_MIN_WIDTH, Math.min(maxByWorkspace, maxByEditor)),
  };
}

export function clampSidebarWidth(width: number, availableWidth: number): number {
  const bounds = sidebarWidthBounds(availableWidth);
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(width)));
}
