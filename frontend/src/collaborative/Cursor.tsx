export interface CursorProps {
  x: number;
  y: number;
  name: string;
  color: string;
}

export function Cursor({ x, y, name, color }: CursorProps) {
  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none transition-transform duration-75 ease-out z-40"
      style={{
        transform: `translateX(${x}px) translateY(${y}px)`,
      }}
      data-testid="live-cursor"
    >
      {/* Glowing SVG pointer */}
      <svg
        className="relative"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(0 2px 6px ${color}) drop-shadow(0 0 4px ${color})`,
        }}
        aria-hidden="true"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>

      {/* Collaborator Name Tag with soft glowing pill */}
      {name && (
        <div
          className="absolute left-3.5 top-3.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap shadow-md pointer-events-none flex items-center gap-1"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}, 0 2px 5px rgba(0, 0, 0, 0.4)`,
          }}
          data-testid="cursor-name-badge"
        >
          <span>{name}</span>
        </div>
      )}
    </div>
  );
}
