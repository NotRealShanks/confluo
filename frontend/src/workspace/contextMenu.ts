export function getContextMenuPosition(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const menuWidth = 220;
  const menuHeight = 280;
  return {
    x: Math.max(4, Math.min(x, viewportWidth - menuWidth - 4)),
    y: Math.max(4, Math.min(y, viewportHeight - menuHeight - 4)),
  };
}
