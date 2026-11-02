import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowRight, Play, Share2, MessageSquare, Files, Terminal as TerminalIcon, Check, ChevronDown } from "lucide-react";
import { motion } from "motion/react";

const COLLABORATORS = [
  { phrase: "together.", name: "Steven", color: "#c084fc" },
  { phrase: "in real time.", name: "Stacy", color: "#60a5fa" },
  { phrase: "from anywhere.", name: "Jonathan", color: "#f472b6" },
  { phrase: "without friction.", name: "Steven", color: "#a3e635" },
];

export function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState(COLLABORATORS[0].phrase);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentCollab = COLLABORATORS[phraseIndex % COLLABORATORS.length];

  // Typewriter effect with reduced-motion check
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReducedMotion) return;

    const currentPhrase = COLLABORATORS[phraseIndex].phrase;
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText === currentPhrase) {
      // Pause at end of completed phrase
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === "") {
      // Finished deleting, pause briefly then move to next phrase
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % COLLABORATORS.length);
      }, 250);
    } else if (isDeleting) {
      // Delete one character
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, displayText.length - 1));
      }, 45);
    } else {
      // Type one character
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, displayText.length + 1));
      }, 85);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28">
      {/* Background Technical Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#303B3418_1px,transparent_1px),linear-gradient(to_bottom,#303B3418_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial Pill & Headline */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3.5 py-1 font-mono text-xs text-[#a1a1aa] mb-6 shadow-sm"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-white" />
            <span className="text-[#f4f4f5] font-medium">Confluo 2026 Engine</span>
            <span className="text-[#71717a]">/</span>
            <span>Real-Time Code Collaboration & Execution</span>
          </motion.div>

          {/* Accessible Heading for Screen Readers */}
          <h1 className="sr-only">One workspace. Multiple minds. Build software, together in real time.</h1>

          {/* Visual Dynamic Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            aria-hidden="true"
            className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#f4f4f5] max-w-4xl"
          >
            One workspace. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f4f4f5] via-zinc-200 to-[#f4f4f5]">
              Build software,{" "}
              <span className="text-white inline-block min-w-[200px] sm:min-w-[340px] text-left relative">
                <span
                  className="rounded px-0.5 transition-colors duration-150"
                  style={{
                    backgroundColor: isDeleting ? `${currentCollab.color}35` : "transparent",
                  }}
                >
                  {displayText}
                </span>
                <span className="relative inline-block align-middle -ml-0.5">
                  {/* Caret Bar */}
                  <span
                    className="inline-block w-[3px] h-[0.9em] align-middle rounded-full animate-pulse transition-colors duration-300"
                    style={{ backgroundColor: currentCollab.color }}
                  />
                  {/* Liveblocks-style collaborator name flag tag */}
                  <span
                    className="absolute -top-[1.2em] left-0 text-[10px] sm:text-[11px] font-sans font-bold tracking-tight text-white px-1.5 py-0.5 rounded-t-[4px] rounded-br-[4px] shadow-md pointer-events-none select-none transition-all duration-300 whitespace-nowrap z-10"
                    style={{ backgroundColor: currentCollab.color }}
                  >
                    {currentCollab.name}
                  </span>
                </span>
              </span>
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-[#a1a1aa] max-w-2xl font-sans leading-relaxed"
          >
            A unified browser-based collaborative development workspace where engineering teams edit code together in real time, discuss implementations with inline gutter comments, and run code in isolated cloud sandboxes.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-md border border-white bg-white text-black px-6 py-3 font-mono text-sm font-semibold transition-all hover:bg-zinc-200 hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
            >
              <span>Start building</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="#walkthrough"
              className="inline-flex items-center gap-2 rounded-md border border-[#27272a] bg-[#121214] px-6 py-3 font-mono text-sm font-medium text-[#f4f4f5] transition-colors hover:border-[#3f3f46] hover:bg-[#18181b]"
            >
              <span>Explore the workspace</span>
            </a>
          </motion.div>

          {/* Scroll Invitation Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8"
          >
            <a
              href="#walkthrough"
              className="inline-flex flex-col items-center gap-1 text-[11px] font-mono text-[#71717a] hover:text-white transition-colors"
            >
              <span>Interactive Walkthrough</span>
              <ChevronDown size={14} className="animate-bounce text-white" />
            </a>
          </motion.div>
        </div>

        {/* Authentic Confluo IDE Preview Mock */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 relative rounded-xl border border-[#27272a] bg-[#09090b] shadow-2xl overflow-hidden"
        >
          {/* Top IDE Shell Header */}
          <div className="flex items-center justify-between border-b border-[#27272a] bg-[#121214] px-3 py-2 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#27272a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27272a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27272a]" />
              </div>
              <span className="text-[#71717a]">|</span>
              <span className="font-semibold text-[#f4f4f5]">distributed-raft</span>
              <span className="rounded bg-[#18181b] px-1.5 py-0.5 text-[10px] text-[#d4d4d8] border border-[#27272a]">
                OWNER
              </span>
            </div>

            {/* Collaborators Presence Stack & Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#121214] bg-white text-black font-bold text-[10px]">
                  ER
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#121214] bg-[#d4d4d8] text-[#09090b] font-bold text-[10px]">
                  DM
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#121214] bg-[#27272a] text-[#f4f4f5] font-bold text-[10px]">
                  +1
                </div>
              </div>

              <button
                type="button"
                className="hidden sm:inline-flex items-center gap-1 rounded border border-[#27272a] bg-[#18181b] px-2 py-1 text-[11px] text-[#a1a1aa] hover:text-[#f4f4f5]"
              >
                <Share2 size={12} />
                <span>Share</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded border border-white bg-white text-black/15 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white text-black/25"
              >
                <Play size={12} className="fill-[#ffffff]" />
                <span>Run</span>
              </button>
            </div>
          </div>

          {/* IDE Main Area: Activity Bar + Explorer + Monaco + Terminal */}
          <div className="grid grid-cols-1 md:grid-cols-[44px_210px_1fr] bg-[#09090b] min-h-[460px]">
            {/* 1. Activity Bar */}
            <div className="hidden md:flex flex-col items-center justify-between border-r border-[#27272a] bg-[#121214] py-3">
              <div className="flex flex-col items-center gap-4 text-[#a1a1aa]">
                <span className="p-1.5 rounded text-white bg-[#18181b] border-l-2 border-white">
                  <Files size={16} />
                </span>
                <span className="p-1.5 rounded hover:text-[#f4f4f5] transition-colors">
                  <MessageSquare size={16} />
                </span>
                <span className="p-1.5 rounded hover:text-[#f4f4f5] transition-colors">
                  <TerminalIcon size={16} />
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white" title="Liveblocks Connected" />
              </div>
            </div>

            {/* 2. File Explorer */}
            <div className="hidden md:block border-r border-[#27272a] bg-[#121214]/70 p-3 font-mono text-xs">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] mb-2">
                Explorer
              </div>
              <div className="space-y-1 text-[#a1a1aa]">
                <div className="text-[#f4f4f5] font-medium flex items-center gap-1.5">
                  <span className="text-[#71717a]">▾</span> src/
                </div>
                <div className="pl-4 flex items-center justify-between py-0.5 rounded bg-[#18181b] text-white font-medium border-l border-white">
                  <span>consensus.py</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white mr-2" />
                </div>
                <div className="pl-4 py-0.5 hover:text-[#f4f4f5]">node.py</div>
                <div className="pl-4 py-0.5 hover:text-[#f4f4f5]">network.ts</div>
                <div className="pt-2 text-[11px] text-[#71717a]">README.md</div>
                <div className="text-[11px] text-[#71717a]">e2b.json</div>
              </div>
            </div>

            {/* 3. Editor & Terminal Column */}
            <div className="flex flex-col min-w-0">
              {/* Tab Bar */}
              <div className="flex items-center border-b border-[#27272a] bg-[#121214] px-2 font-mono text-xs overflow-x-auto">
                <div className="flex items-center gap-2 border-r border-t-2 border-r-[#27272a] border-t-[#ffffff] bg-[#09090b] px-3 py-1.5 text-[#f4f4f5] font-medium">
                  <span className="text-white">PY</span>
                  <span>consensus.py</span>
                  <span className="text-[#71717a] hover:text-[#f4f4f5]">×</span>
                </div>
                <div className="flex items-center gap-2 border-r border-[#27272a] px-3 py-1.5 text-[#a1a1aa] hover:text-[#f4f4f5]">
                  <span className="text-[#d4d4d8]">TS</span>
                  <span>network.ts</span>
                </div>
              </div>

              {/* Code Surface with Simulated Multiplayer Cursors & Gutter Comment */}
              <div className="relative flex-1 p-4 font-mono text-xs leading-relaxed text-[#f4f4f5] overflow-hidden select-none bg-[#09090b]">
                <div className="grid grid-cols-[30px_1fr] gap-4">
                  {/* Line Numbers */}
                  <div className="text-[#71717a] text-right space-y-1">
                    <div>11</div>
                    <div>12</div>
                    <div>13</div>
                    <div>14</div>
                    <div>15</div>
                    <div>16</div>
                    <div>17</div>
                    <div className="text-white font-bold">18</div>
                    <div>19</div>
                    <div>20</div>
                    <div>21</div>
                    <div>22</div>
                  </div>

                  {/* Code Lines */}
                  <div className="space-y-1 overflow-x-auto">
                    <div><span className="text-[#d4d4d8]">class</span> <span className="text-white">RaftNode</span>:</div>
                    <div className="pl-4 text-[#a1a1aa]"># Election and heartbeat timeout synchronization</div>
                    <div className="pl-4"><span className="text-[#d4d4d8]">def</span> <span className="text-[#f4f4f5]">request_vote</span>(self, term: <span className="text-white">int</span>, candidate_id: <span className="text-white">str</span>):</div>
                    
                    {/* Live Cursor 1: Elena */}
                    <div className="relative pl-8">
                      <span className="text-[#d4d4d8]">if</span> term &lt; self.current_term:
                      {/* Elena's Cursor Badge */}
                      <span className="absolute -top-4 left-6 rounded bg-white text-black px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#09090b] shadow-sm flex items-center gap-1">
                        Elena R.
                      </span>
                      <span className="inline-block w-0.5 h-4 bg-white text-black animate-pulse ml-0.5 align-middle" />
                    </div>

                    <div className="pl-12 text-[#a1a1aa]">return False</div>
                    <div className="pl-8 text-[#a1a1aa]">self.votes_received.add(candidate_id)</div>

                    {/* Line 18 with Inline Comment Badge */}
                    <div className="relative pl-8 rounded bg-[#121214] border-l-2 border-[#FFD166] py-0.5 px-2 my-1">
                      <span className="text-[#d4d4d8]">if</span> len(self.votes_received) &gt; (self.cluster_size // 2):
                      
                      {/* Live Cursor 2: Devin */}
                      <span className="absolute -top-4 right-12 rounded bg-[#d4d4d8] px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#09090b] shadow-sm">
                        Devin M.
                      </span>
                    </div>

                    {/* Inline Comment Thread Overlay */}
                    <div className="ml-4 sm:ml-8 my-2 max-w-md rounded-lg border border-[#27272a] bg-[#121214] p-3 text-[11px] shadow-lg">
                      <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-[#d4d4d8] text-[#09090b] font-bold flex items-center justify-center text-[9px]">
                            DM
                          </span>
                          <span className="font-semibold text-[#f4f4f5]">Devin M.</span>
                          <span className="text-[#71717a]">line 18 • 2m ago</span>
                        </div>
                        <span className="text-[10px] text-white bg-[#1c1c20] px-1.5 py-0.5 rounded border border-[#27272a]">
                          active
                        </span>
                      </div>
                      <p className="text-[#a1a1aa] leading-relaxed">
                        Quorum check is robust. Elena, will the candidate state transition to leader immediately upon quorum?
                      </p>
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-[#27272a]/60 text-[10px]">
                        <span className="text-[#71717a]">1 reply from Elena</span>
                        <span className="text-white hover:underline cursor-pointer flex items-center gap-1">
                          <Check size={11} /> Resolve thread
                        </span>
                      </div>
                    </div>

                    <div className="pl-12 text-[#a1a1aa]">self.state = <span className="text-white">NodeState.LEADER</span></div>
                    <div className="pl-12 text-[#a1a1aa]">self.broadcast_heartbeats()</div>
                  </div>
                </div>
              </div>

              {/* Bottom Terminal Panel */}
              <div className="border-t border-[#27272a] bg-[#09090b] font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#27272a] bg-[#121214] px-3 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <TerminalIcon size={12} />
                      1: bash (E2B Sandbox)
                    </span>
                    <span className="text-[#71717a]">|</span>
                    <span className="text-[#a1a1aa]">Output</span>
                  </div>
                  <span className="text-[10px] text-[#71717a]">exit 0 (0.24s)</span>
                </div>
                <div className="p-3 text-[#a1a1aa] space-y-1">
                  <div className="flex items-center gap-2 text-[#f4f4f5]">
                    <span className="text-white">confluo:~/distributed-raft$</span>
                    <span>python3 consensus.py</span>
                  </div>
                  <div className="text-[#d4d4d8]">[E2B Isolated Micro-VM initialized]</div>
                  <div className="text-white">✓ 3/3 Raft peers initialized on network mesh</div>
                  <div className="text-[#f4f4f5]">✓ Leader election term 1 passed with unanimous quorum</div>
                  <div className="text-[#71717a]">--- Process finished with exit code 0 ---</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
