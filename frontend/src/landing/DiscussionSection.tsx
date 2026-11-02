import { useState } from "react";
import { Check, CornerDownRight, Send } from "lucide-react";

export function DiscussionSection() {
  const [resolved, setResolved] = useState(false);
  const [replies, setReplies] = useState([
    {
      author: "Elena R.",
      role: "OWNER",
      time: "1m ago",
      text: "Rechecked the IEEE 754 spec. We should use math.isclose with rel_tol=1e-9 to prevent floating-point drift.",
    },
  ]);
  const [inputVal, setInputVal] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setReplies((prev) => [
      ...prev,
      {
        author: "You",
        role: "EDITOR",
        time: "just now",
        text: inputVal.trim(),
      },
    ]);
    setInputVal("");
  };

  return (
    <section id="discussions" className="relative border-t border-[#27272a] bg-[#121214]/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3 py-1 font-mono text-xs text-[#a1a1aa] mb-4">
            <span className="text-[#FFD166]">03</span>
            <span className="text-[#71717a]">/</span>
            <span>Inline Code Reviews & Discussions</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f4f5]">
            Conversations anchored directly to code.
          </h2>

          <p className="mt-4 text-base text-[#a1a1aa] leading-relaxed">
            Stop losing architectural feedback in external chat threads. Confluo attaches discussion threads directly to editor lines with syntax quotes, real-time replies, and resolution controls.
          </p>
        </div>

        {/* Live Interactive Thread Demonstration */}
        <div className="mt-12 rounded-xl border border-[#27272a] bg-[#09090b] p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Editor Code Context */}
            <div className="lg:col-span-5 rounded-lg border border-[#27272a] bg-[#121214] p-4 font-mono text-xs">
              <div className="text-[#71717a] text-[11px] mb-3 pb-2 border-b border-[#27272a] flex items-center justify-between">
                <span>geometry/vector.ts</span>
                <span className="text-white">Live Monaco Gutter</span>
              </div>

              <div className="space-y-1.5 text-[#a1a1aa]">
                <div className="flex gap-3">
                  <span className="text-[#71717a]">31</span>
                  <span>function normalize(vec: Vector3): Vector3 &#123;</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#71717a]">32</span>
                  <span className="pl-4">const len = Math.hypot(vec.x, vec.y, vec.z);</span>
                </div>
                {/* Highlighted Line 33 */}
                <div className="flex items-center gap-3 bg-[#1c1c20] text-[#f4f4f5] py-1 px-1 rounded border-l-2 border-white">
                  <span className="text-white font-bold">33</span>
                  <span className="pl-4">if (len === 0) return &#123; x: 0, y: 0, z: 0 &#125;;</span>
                  <span className="ml-auto text-white text-[10px] bg-[#09090b] px-1.5 py-0.5 rounded border border-[#27272a]">
                    Thread #1
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#71717a]">34</span>
                  <span className="pl-4">return &#123; x: vec.x / len, y: vec.y / len, z: vec.z / len &#125;;</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#71717a]">35</span>
                  <span>&#125;</span>
                </div>
              </div>
            </div>

            {/* Interactive Comment Widget */}
            <div className="lg:col-span-7 rounded-xl border border-[#27272a] bg-[#121214] p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d4d4d8] text-[#09090b] font-bold text-[10px]">
                    DM
                  </span>
                  <div>
                    <span className="font-semibold text-xs text-[#f4f4f5]">Devin M.</span>
                    <span className="text-[10px] text-[#71717a] ml-2 font-mono">line 33 • 5m ago</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResolved((r) => !r)}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                      resolved
                        ? "border border-white bg-[#1c1c20] text-white"
                        : "border border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:text-[#f4f4f5]"
                    }`}
                  >
                    <Check size={12} />
                    <span>{resolved ? "Resolved" : "Mark as resolved"}</span>
                  </button>
                </div>
              </div>

              {/* Thread Quote */}
              <div className="mt-3 rounded border-l-2 border-[#d4d4d8] bg-[#09090b] px-3 py-1.5 font-mono text-xs text-[#a1a1aa]">
                <span className="text-[#71717a] text-[10px] block">Quoting line 33:</span>
                <code>if (len === 0) return &#123; x: 0, y: 0, z: 0 &#125;;</code>
              </div>

              {/* Main Comment */}
              <p className="mt-3 text-xs text-[#f4f4f5] leading-relaxed">
                Should we guard against subnormal floats or epsilon boundaries? In WebGL raymarching, <code className="text-white font-mono">1e-12</code> will bypass the strict zero equality check and trigger division by near-zero.
              </p>

              {/* Replies List */}
              <div className="mt-4 space-y-3 pt-3 border-t border-[#27272a]/60">
                {replies.map((reply, i) => (
                  <div key={i} className="flex items-start gap-2.5 pl-3 border-l border-[#27272a]">
                    <CornerDownRight size={13} className="text-[#71717a] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-semibold text-[#f4f4f5]">{reply.author}</span>
                        <span className="rounded bg-[#18181b] px-1.5 py-0.2 text-[9px] font-mono text-[#d4d4d8]">
                          {reply.role}
                        </span>
                        <span className="text-[#71717a] text-[10px] font-mono">{reply.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">{reply.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Reply Input */}
              <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 pt-3 border-t border-[#27272a]">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Reply to this thread or suggest a fix…"
                  className="flex-1 rounded border border-[#27272a] bg-[#09090b] px-3 py-1.5 text-xs text-[#f4f4f5] placeholder-[#71717a] focus:border-white focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded border border-white bg-white text-black px-3 py-1.5 text-xs font-semibold text-[#09090b] hover:bg-zinc-200 font-mono"
                >
                  <Send size={12} />
                  <span>Reply</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
