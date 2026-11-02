import { useState, useEffect } from "react";
import {
  Code2,
  Users,
  MessageSquare,
  Play,
  Terminal,
  CheckCircle2,
  Pause,
  ChevronRight,
} from "lucide-react";

export interface WalkthroughStep {
  id: number;
  badge: string;
  title: string;
  summary: string;
  details: string;
  icon: typeof Code2;
}

const STEPS: WalkthroughStep[] = [
  {
    id: 1,
    badge: "01 / EDITOR",
    title: "Write code with zero setup",
    summary: "Full Monaco code editing directly in the browser with language syntax support, tabs, and file trees.",
    details: "Instantly open workspaces with VS Code keybindings, formatting, and tab state management.",
    icon: Code2,
  },
  {
    id: 2,
    badge: "02 / REAL-TIME CRDT",
    title: "Collaborate simultaneously",
    summary: "Multiple developers edit the same file in real time with Liveblocks and Yjs conflict-free synchronization.",
    details: "Watch collaborator cursors and live selections update with sub-millisecond latency.",
    icon: Users,
  },
  {
    id: 3,
    badge: "03 / DISCUSSIONS",
    title: "Inline gutter discussions",
    summary: "Click any line gutter to attach review questions, suggest code optimizations, and resolve threads.",
    details: "Conversations remain anchored to the exact line of code rather than scattered across Slack.",
    icon: MessageSquare,
  },
  {
    id: 4,
    badge: "04 / E2B SANDBOX",
    title: "Execute in isolated cloud micro-VMs",
    summary: "Trigger code execution with one click. Dedicated micro-VM containers compile and run code safely.",
    details: "Enforces strict memory, execution timeouts (30s), and token-authenticated container boundaries.",
    icon: Play,
  },
  {
    id: 5,
    badge: "05 / RESULTS",
    title: "Stream output & manage terminals",
    summary: "Real-time bounded stdout and stderr stream directly into the integrated Linux terminal.",
    details: "Multi-session terminal tabs let you run compilation commands and virtual filesystem scripts.",
    icon: Terminal,
  },
];

export function StickyWalkthroughSection() {
  const [activeStep, setActiveStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-cycle through steps when isPlaying is true
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % STEPS.length) + 1);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentStep = STEPS[activeStep - 1];

  return (
    <section id="walkthrough" className="relative border-t border-[#27272a] bg-[#09090b] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-12 border-b border-[#27272a]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3 py-1 font-mono text-xs text-[#a1a1aa] mb-3">
              <span className="text-white font-bold">INTERACTIVE DEMO</span>
              <span className="text-[#71717a]">/</span>
              <span>The 5-Step Collaborative Journey</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f4f5]">
              Experience the unified developer workflow.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#a1a1aa] leading-relaxed">
              Step through how an engineering team writes, collaborates, reviews, and executes code together without ever leaving Confluo.
            </p>
          </div>

          {/* Play/Pause & Step Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-2 rounded border border-[#27272a] bg-[#121214] px-3 py-1.5 font-mono text-xs text-[#f4f4f5] hover:border-white hover:text-white transition-colors"
              aria-label={isPlaying ? "Pause walkthrough" : "Auto-play walkthrough"}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
              <span>{isPlaying ? "Pause Demo" : "Auto-Play"}</span>
            </button>

            <div className="flex items-center gap-1 font-mono text-xs">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    setActiveStep(step.id);
                    setIsPlaying(false);
                  }}
                  className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
                    activeStep === step.id
                      ? "bg-white text-black font-bold shadow-[0_0_10px_rgba(255, 255, 255, 0.25)]"
                      : "bg-[#121214] text-[#a1a1aa] border border-[#27272a] hover:text-[#f4f4f5]"
                  }`}
                  aria-label={`Go to step ${step.id}: ${step.title}`}
                >
                  {step.id}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Two-Column Interactive Showcase */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Step Cards */}
          <div className="lg:col-span-5 space-y-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => {
                    setActiveStep(step.id);
                    setIsPlaying(false);
                  }}
                  className={`cursor-pointer rounded-xl border p-4.5 transition-all text-left relative overflow-hidden ${
                    isActive
                      ? "border-white bg-[#121214] shadow-[0_0_20px_rgba(255, 255, 255, 0.25)]"
                      : "border-[#27272a] bg-[#09090b]/70 hover:border-[#3f3f46] hover:bg-[#121214]/50"
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-white text-black" />
                  )}

                  <div className="flex items-center justify-between font-mono text-[11px] text-[#71717a]">
                    <div className="flex items-center gap-2">
                      <span className={isActive ? "text-white font-semibold" : "text-[#a1a1aa]"}>
                        {step.badge}
                      </span>
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-white text-[10px]">
                        <span>ACTIVE</span>
                        <ChevronRight size={12} />
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded p-2 border shrink-0 ${
                        isActive
                          ? "border-white/40 bg-[#1c1c20] text-white"
                          : "border-[#27272a] bg-[#121214] text-[#a1a1aa]"
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <div>
                      <h3
                        className={`font-display text-sm font-semibold ${
                          isActive ? "text-[#f4f4f5]" : "text-[#a1a1aa]"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
                        {step.summary}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Mock Preview (Updates per Step) */}
          <div className="lg:col-span-7 sticky top-20">
            <div className="rounded-xl border border-[#27272a] bg-[#121214] overflow-hidden shadow-2xl transition-all">
              {/* Top Bar with Step Pill */}
              <div className="flex items-center justify-between border-b border-[#27272a] bg-[#18181b] px-4 py-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-[#09090b] px-2.5 py-0.5 text-[11px] text-white border border-[#27272a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    <span>Step {currentStep.id}: {currentStep.title}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#a1a1aa] text-[11px]">
                  <span>distributed_raft.py</span>
                  <span className="text-[#71717a]">|</span>
                  <span className="text-[#f4f4f5]">UTF-8</span>
                </div>
              </div>

              {/* Dynamic Step View */}
              <div className="p-5 font-mono text-xs leading-relaxed bg-[#09090b] min-h-[360px] flex flex-col justify-between">
                {/* Step 1: Write Code */}
                {activeStep === 1 && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-[#71717a] border-b border-[#27272a] pb-2 flex items-center justify-between">
                      <span>Monaco Syntax Engine (Python)</span>
                      <span className="text-white">Clean Document State</span>
                    </div>
                    <div className="text-[#d4d4d8]">from dataclasses import dataclass</div>
                    <div className="text-[#d4d4d8]">from typing import List, Optional</div>
                    <div className="pt-2">
                      <span className="text-[#d4d4d8]">@dataclass</span>
                    </div>
                    <div>
                      <span className="text-[#d4d4d8]">class</span> <span className="text-white">LogEntry</span>:
                    </div>
                    <div className="pl-4">index: <span className="text-white">int</span></div>
                    <div className="pl-4">term: <span className="text-white">int</span></div>
                    <div className="pl-4">command: <span className="text-white">bytes</span></div>
                    <div className="pt-2 text-[#a1a1aa]"># Monaco provides real-time autocomplete and diagnostics</div>
                  </div>
                )}

                {/* Step 2: Real-time Collaboration */}
                {activeStep === 2 && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-[#71717a] border-b border-[#27272a] pb-2 flex items-center justify-between">
                      <span>Liveblocks WebSocket Mesh</span>
                      <span className="text-white flex items-center gap-1">
                        <Users size={12} /> 2 Collaborators Editing
                      </span>
                    </div>
                    <div className="text-[#d4d4d8]">class RaftCluster:</div>
                    <div className="pl-4 text-[#a1a1aa]">def append_entries(self, term: int, leader_id: str):</div>
                    {/* Elena's active editing line */}
                    <div className="relative pl-8 rounded bg-[#1c1c20] py-1 border-l-2 border-white">
                      <span className="text-[#f4f4f5]">if term &gt;= self.current_term:</span>
                      <span className="absolute -top-3.5 right-4 rounded bg-white text-black px-1.5 py-0.2 text-[9px] font-bold text-[#09090b]">
                        Elena R. (Owner)
                      </span>
                    </div>
                    {/* Devin's active editing line */}
                    <div className="relative pl-8 rounded bg-[#18181b] py-1 border-l-2 border-[#d4d4d8] mt-2">
                      <span className="text-[#f4f4f5]">self.commit_index = min(leader_commit, last_new_entry)</span>
                      <span className="absolute -top-3.5 right-4 rounded bg-[#d4d4d8] px-1.5 py-0.2 text-[9px] font-bold text-[#09090b]">
                        Devin M. (Editor)
                      </span>
                    </div>
                  </div>
                )}

                {/* Step 3: Inline Discussions */}
                {activeStep === 3 && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-[#71717a] border-b border-[#27272a] pb-2 flex items-center justify-between">
                      <span>Gutter Code Thread #4</span>
                      <span className="text-[#FFD166]">Discussion Open</span>
                    </div>
                    <div className="rounded border-l-2 border-[#FFD166] bg-[#121214] p-2.5 text-[#f4f4f5]">
                      <div className="text-[10px] text-[#71717a]">Line 24:</div>
                      <code>self.commit_index = min(leader_commit, last_new_entry)</code>
                    </div>
                    <div className="rounded-lg border border-[#27272a] bg-[#121214] p-3 text-[11px]">
                      <div className="flex items-center justify-between pb-1 text-[10px] text-[#71717a]">
                        <span className="font-semibold text-[#f4f4f5]">Devin M.:</span>
                        <span>just now</span>
                      </div>
                      <p className="text-[#a1a1aa]">
                        Verified! Should we update the state machine apply index immediately following this assignment?
                      </p>
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-[#27272a] text-[10px]">
                        <span className="text-white flex items-center gap-1 cursor-pointer">
                          <CheckCircle2 size={11} /> Ready to resolve
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: E2B Sandbox Execution */}
                {activeStep === 4 && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-[#71717a] border-b border-[#27272a] pb-2 flex items-center justify-between">
                      <span>E2B Micro-VM Runtime</span>
                      <span className="text-white">Spawning Container</span>
                    </div>
                    <div className="rounded-lg border border-[#27272a] bg-[#121214] p-3 space-y-2">
                      <div className="flex items-center justify-between text-[#f4f4f5]">
                        <span className="text-white font-semibold">1. Validating Payload</span>
                        <span>Pass (&lt; 100 files, 1 MB)</span>
                      </div>
                      <div className="flex items-center justify-between text-[#f4f4f5]">
                        <span className="text-white font-semibold">2. Constant-time Auth</span>
                        <span>Pass (crypto.timingSafeEqual)</span>
                      </div>
                      <div className="flex items-center justify-between text-[#f4f4f5]">
                        <span className="text-white font-semibold">3. Micro-VM Sandbox</span>
                        <span className="text-white animate-pulse">Running in E2B micro-VM (180ms)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Results & Terminal */}
                {activeStep === 5 && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-[#71717a] border-b border-[#27272a] pb-2 flex items-center justify-between">
                      <span>Integrated Terminal Panel</span>
                      <span className="text-white">exit 0 • completed</span>
                    </div>
                    <div className="text-white">confluo:~/distributed-consensus$ python3 raft.py</div>
                    <div className="text-[#d4d4d8]">[E2B Isolated Container stdout stream]</div>
                    <div className="text-[#f4f4f5]">✓ Initialized 3 consensus nodes on virtual cluster network</div>
                    <div className="text-[#f4f4f5]">✓ Leader election committed in 42ms (Quorum 3/3)</div>
                    <div className="text-white">✓ All assertions passed (100 KB bounded stream)</div>
                    <div className="text-[#71717a]">--- Process finished with exit code 0 ---</div>
                  </div>
                )}

                {/* Bottom Step Description Meta */}
                <div className="pt-3 border-t border-[#27272a] flex items-center justify-between text-[11px] text-[#a1a1aa]">
                  <span>{currentStep.details}</span>
                  <span className="font-semibold text-white">{activeStep} / 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
