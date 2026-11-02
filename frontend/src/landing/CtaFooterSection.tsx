import { Link } from "react-router";
import { ArrowRight, Terminal } from "lucide-react";

export function CtaFooterSection() {
  return (
    <footer className="relative border-t border-[#27272a] bg-[#09090b] pt-20 pb-12">
      {/* Final Call to Action */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-[#27272a] bg-[#121214] p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#303B3415_1px,transparent_1px),linear-gradient(to_bottom,#303B3415_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#27272a] bg-[#09090b] px-3 py-1 font-mono text-xs text-white mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>Confluo Cloud Workspace</span>
            </span>

            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#f4f4f5]">
              Your next project deserves a shared workspace.
            </h2>

            <p className="mt-4 text-sm sm:text-base text-[#a1a1aa] leading-relaxed">
              Create a project, invite collaborators, edit without merge conflicts, and execute code in isolated cloud micro-VMs.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md border border-white bg-white text-black px-6 py-3 font-mono text-sm font-semibold transition-all hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              >
                <span>Start building</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md border border-[#27272a] bg-[#09090b] px-6 py-3 font-mono text-sm font-medium text-[#f4f4f5] transition-colors hover:border-[#3f3f46] hover:bg-[#18181b]"
              >
                <span>Sign in to workspace</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Technical Footer */}
        <div className="mt-16 pt-8 border-t border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-[#a1a1aa]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-[#27272a] bg-[#121214] text-white">
                <Terminal size={11} />
              </span>
              <span className="font-display text-sm font-bold text-[#f4f4f5]">
                Confluo
                <span className="inline-block h-1 w-1 rounded-full bg-white ml-0.5" />
              </span>
            </div>
            <span className="text-[#71717a]">|</span>
            <span>Real-Time Collaborative Code Editor</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#problem" className="hover:text-[#f4f4f5] transition-colors">
              Problem
            </a>
            <a href="#collaboration" className="hover:text-[#f4f4f5] transition-colors">
              CRDT
            </a>
            <a href="#discussions" className="hover:text-[#f4f4f5] transition-colors">
              Threads
            </a>
            <a href="#execution" className="hover:text-[#f4f4f5] transition-colors">
              Sandboxes
            </a>
            <a href="#architecture" className="hover:text-[#f4f4f5] transition-colors">
              Architecture
            </a>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#71717a]">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="text-[#a1a1aa]">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
