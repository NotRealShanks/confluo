import { Link } from "react-router";
import { Terminal, ArrowLeft, FolderKanban } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-12 text-[#f4f4f5] selection:bg-white text-black selection:text-[#09090b]">
      {/* Background Technical Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#303B3418_1px,transparent_1px),linear-gradient(to_bottom,#303B3418_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative w-full max-w-md rounded-xl border border-[#27272a] bg-[#121214] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[#27272a] bg-[#09090b] text-white mb-5">
          <Terminal size={22} />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6B6B]/40 bg-[#2A1515] px-2.5 py-0.5 font-mono text-[10px] text-[#FF6B6B] mb-3">
          <span>HTTP 404</span>
          <span className="text-[#71717a]">/</span>
          <span>ROUTE_NOT_FOUND</span>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-[#f4f4f5]">
          Workspace Not Found
        </h1>

        <p className="mt-2 text-xs text-[#a1a1aa] leading-relaxed font-mono">
          The requested URL path does not resolve to an existing project, workspace, or resource.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 font-mono text-xs">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 rounded-md border border-white bg-white text-black py-2.5 font-semibold text-[#09090b] hover:bg-zinc-200 transition-all"
          >
            <FolderKanban size={14} />
            <span>Return to Workspaces</span>
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-md border border-[#27272a] bg-[#09090b] py-2.5 text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b] transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

