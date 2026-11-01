import { useStatus } from "@liveblocks/react/suspense";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const status = useStatus();

  switch (status) {
    case "connected":
      return (
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1b2b22] border border-[#234232] text-[11px] text-emerald-400 select-none"
          title="Real-time collaboration active (low latency)"
          data-testid="connection-status-connected"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          <span className="font-medium hidden sm:inline">Connected</span>
        </div>
      );

    case "connecting":
      return (
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#162536] border border-[#21374f] text-[11px] text-sky-400 select-none"
          title="Establishing connection to collaboration service…"
          data-testid="connection-status-connecting"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="font-medium hidden sm:inline">Connecting…</span>
        </div>
      );

    case "reconnecting":
      return (
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#352514] border border-[#52371c] text-[11px] text-amber-400 select-none animate-pulse"
          title="Network interrupted. Reconnecting automatically…"
          data-testid="connection-status-reconnecting"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span className="font-medium hidden sm:inline">Reconnecting…</span>
        </div>
      );

    case "disconnected":
    default:
      return (
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#361515] border border-[#542121] text-[11px] text-red-400 select-none"
          title="Offline. Changes are safely saved locally and will sync when back online."
          data-testid="connection-status-offline"
        >
          <WifiOff size={11} className="text-red-400" />
          <span className="font-medium hidden sm:inline">Offline (Edits saved)</span>
        </div>
      );
  }
}

export function ConnectionOfflineBanner() {
  const status = useStatus();

  if (status !== "disconnected" && status !== "reconnecting") {
    return null;
  }

  const isReconnecting = status === "reconnecting";

  return (
    <div
      role="status"
      className="bg-[#2d1b11] border-b border-[#5e351f] px-3 py-1.5 text-xs text-[#fed7aa] flex items-center justify-between gap-2 shrink-0 select-none"
      data-testid="connection-offline-banner"
    >
      <div className="flex items-center gap-2">
        {isReconnecting ? (
          <Wifi size={14} className="text-amber-400 shrink-0 animate-pulse" />
        ) : (
          <AlertCircle size={14} className="text-amber-400 shrink-0" />
        )}
        <span>
          {isReconnecting
            ? "Network connection interrupted. Reconnecting automatically…"
            : "You are currently offline. Your changes are safely saved locally and will sync once reconnected."}
        </span>
      </div>
      <span className="text-[10px] text-amber-300/70 shrink-0 font-medium hidden md:inline">
        Yjs CRDT Offline Storage Active
      </span>
    </div>
  );
}

