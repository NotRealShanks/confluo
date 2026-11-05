import { Suspense, useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import AccountMenu from "./AccountMenu";
import { InboxNotificationMenu } from "../comments";
import { LiveblocksProvider } from "@liveblocks/react/suspense";
import { makeUserAuthEndpoint } from "../liveblocksAuth";
import { useAuth } from "../auth/context";
import { Terminal } from "lucide-react";

export default function AppShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  const { user } = useAuth();
  const userAuthEndpoint = useMemo(() => makeUserAuthEndpoint(), []);
  const width = wide ? "max-w-7xl" : "max-w-5xl";

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-white selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#27272a] bg-[#121214]/90 backdrop-blur-md">
        <div className={`mx-auto flex ${width} items-center justify-between px-4 sm:px-6 py-2.5`}>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <span className="flex h-7 w-7 items-center justify-center rounded border border-[#27272a] bg-[#09090b] text-white font-mono text-xs font-bold transition-colors group-hover:border-white">
                <Terminal size={14} />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-[#f4f4f5]">
                Confluo
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white ml-1 align-baseline animate-pulse" />
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-4 font-mono text-xs text-[#a1a1aa]">
              <Link to="/dashboard" className="text-white font-medium hover:text-white transition-colors">
                Workspaces
              </Link>
              <Link to="/landing" className="hover:text-[#f4f4f5] transition-colors">
                Public Overview
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#27272a] bg-[#09090b] px-2.5 py-0.5 font-mono text-[11px] text-[#a1a1aa]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Liveblocks • E2B Online</span>
            </div>
            {user && (
              <LiveblocksProvider authEndpoint={userAuthEndpoint}>
                <Suspense fallback={null}>
                  <InboxNotificationMenu />
                </Suspense>
              </LiveblocksProvider>
            )}
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className={`mx-auto ${width} px-4 sm:px-6 py-8`}>{children}</main>
    </div>
  );
}
