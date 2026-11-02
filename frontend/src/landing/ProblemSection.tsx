import { AlertTriangle, ArrowRight, CheckCircle2, Copy, GitPullRequest, Laptop, MessageCircle, Terminal } from "lucide-react";

export function ProblemSection() {
  return (
    <section id="problem" className="relative border-t border-[#27272a] bg-[#121214]/50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3 py-1 font-mono text-xs text-[#a1a1aa] mb-4">
            <span className="text-[#FF6B6B]">01</span>
            <span className="text-[#71717a]">/</span>
            <span>The Fragmented Workflow Crisis</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#f4f4f5]">
            Developers lose momentum juggling disconnected tools.
          </h2>

          <p className="mt-4 text-base text-[#a1a1aa] leading-relaxed">
            Collaborative coding usually looks like writing in a local editor, pasting snippets into Slack, waiting hours for pull request reviews on GitHub, and struggling to reproduce environment bugs.
          </p>
        </div>

        {/* Comparison Grid: Fragmented Chaos vs Confluo Unified Workspace */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Fragmented Toolchain (The Problem) */}
          <div className="rounded-xl border border-[#FF6B6B]/30 bg-[#09090b] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
                <div className="flex items-center gap-2 text-[#FF6B6B] font-mono text-xs font-semibold uppercase tracking-wider">
                  <AlertTriangle size={15} />
                  <span>The Status Quo: 5 Separate Tools</span>
                </div>
                <span className="font-mono text-xs text-[#71717a]">High Friction</span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-[#27272a] bg-[#121214]/60 p-3.5">
                  <span className="rounded bg-[#18181b] p-2 text-[#FF6B6B] shrink-0 border border-[#27272a]">
                    <Copy size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f4f4f5]">Context Switching & Snippet Pasting</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1">
                      Pasting code blocks into chat apps strips compiler context, formats, and line references.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-[#27272a] bg-[#121214]/60 p-3.5">
                  <span className="rounded bg-[#18181b] p-2 text-[#FF6B6B] shrink-0 border border-[#27272a]">
                    <GitPullRequest size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f4f4f5]">Asynchronous PR Latency</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1">
                      Review comments arrive hours later after engineers have already moved on to different branches.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-[#27272a] bg-[#121214]/60 p-3.5">
                  <span className="rounded bg-[#18181b] p-2 text-[#FF6B6B] shrink-0 border border-[#27272a]">
                    <Laptop size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f4f4f5]">"Works On My Machine" Drift</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1">
                      Teammates run different OS kernels, dependencies, and environment variables, causing debugging stalemates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#27272a] font-mono text-xs text-[#FF6B6B] flex items-center justify-between">
              <span>Result: Disrupted focus & slow iteration</span>
              <span>× Inefficient</span>
            </div>
          </div>

          {/* 2. Confluo Unified Workspace (The Solution) */}
          <div className="rounded-xl border border-white/40 bg-[#09090b] p-6 sm:p-8 flex flex-col justify-between relative shadow-[0_0_30px_rgba(255, 255, 255, 0.25)]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle2 size={15} />
                  <span>The Confluo Solution: One Shared Canvas</span>
                </div>
                <span className="font-mono text-xs text-white bg-[#1c1c20] px-2 py-0.5 rounded border border-[#27272a]">
                  Zero Tool-Switching
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-[#27272a] bg-[#121214] p-3.5 hover:border-[#3f3f46] transition-colors">
                  <span className="rounded bg-[#18181b] p-2 text-white shrink-0 border border-[#27272a]">
                    <Terminal size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f4f4f5]">Instant Collaborative IDE</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1">
                      Monaco Editor paired with Yjs CRDTs for conflict-free, sub-millisecond simultaneous editing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-[#27272a] bg-[#121214] p-3.5 hover:border-[#3f3f46] transition-colors">
                  <span className="rounded bg-[#18181b] p-2 text-white shrink-0 border border-[#27272a]">
                    <MessageCircle size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f4f4f5]">In-Context Code Discussions</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1">
                      Anchor questions and reviews directly to gutter lines. Discuss, reply, and resolve without leaving the file.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-[#27272a] bg-[#121214] p-3.5 hover:border-[#3f3f46] transition-colors">
                  <span className="rounded bg-[#18181b] p-2 text-white shrink-0 border border-[#27272a]">
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f4f4f5]">Deterministic Cloud Sandboxes</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1">
                      Execute C, C++, Python, TypeScript, and Java directly in isolated E2B micro-VMs. Identical outputs for everyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#27272a] font-mono text-xs text-white flex items-center justify-between">
              <span>One workspace. Multiple minds.</span>
              <span className="flex items-center gap-1">
                <span>Unified</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

