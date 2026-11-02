import { useState } from "react";
import { Users, MousePointer2 } from "lucide-react";

export function CollaborationSection() {
  const [activeCollaborator, setActiveCollaborator] = useState<"elena" | "devin">("elena");

  return (
    <section id="collaboration" className="relative border-t border-[#27272a] bg-[#09090b] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Conceptual & Architectural Detail */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3 py-1 font-mono text-xs text-[#a1a1aa] mb-4">
              <span className="text-white">02</span>
              <span className="text-[#71717a]">/</span>
              <span>Multiplayer CRDT Engine</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f4f5]">
              Edit together with zero merge conflicts.
            </h2>

            <p className="mt-4 text-base text-[#a1a1aa] leading-relaxed">
              Powered by Yjs CRDTs (Conflict-free Replicated Data Types) and Liveblocks WebSockets, Confluo synchronizes character-level document changes across all peers simultaneously. No locks, no overwrites, and no lag.
            </p>

            <div className="mt-8 space-y-4 font-mono text-xs">
              <div className="flex items-center gap-3 rounded-lg border border-[#27272a] bg-[#121214] p-3 text-[#f4f4f5]">
                <span className="h-2 w-2 rounded-full bg-white" />
                <span className="font-semibold text-white">Yjs State Vectors:</span>
                <span className="text-[#a1a1aa]">Mathematical convergence on every keystroke</span>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-[#27272a] bg-[#121214] p-3 text-[#f4f4f5]">
                <span className="h-2 w-2 rounded-full bg-[#d4d4d8]" />
                <span className="font-semibold text-[#d4d4d8]">Live Awareness:</span>
                <span className="text-[#a1a1aa]">Real-time line presence, selections, and cursors</span>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-[#27272a] bg-[#121214] p-3 text-[#f4f4f5]">
                <span className="h-2 w-2 rounded-full bg-[#FFD166]" />
                <span className="font-semibold text-[#FFD166]">Offline Recovery:</span>
                <span className="text-[#a1a1aa]">Automatic resync upon network reconnection</span>
              </div>
            </div>

            {/* Interactive Toggle for the Demo */}
            <div className="mt-8 pt-6 border-t border-[#27272a]">
              <span className="text-xs font-mono uppercase tracking-wider text-[#71717a] block mb-2">
                Simulate Collaborator Focus:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCollaborator("elena")}
                  className={`flex items-center gap-2 rounded px-3 py-1.5 font-mono text-xs transition-colors ${
                    activeCollaborator === "elena"
                      ? "border border-white bg-[#1c1c20] text-white font-semibold"
                      : "border border-[#27272a] bg-[#121214] text-[#a1a1aa] hover:text-[#f4f4f5]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span>Elena (Editor - Optimizing Query)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCollaborator("devin")}
                  className={`flex items-center gap-2 rounded px-3 py-1.5 font-mono text-xs transition-colors ${
                    activeCollaborator === "devin"
                      ? "border border-[#d4d4d8] bg-[#18181b] text-[#d4d4d8] font-semibold"
                      : "border border-[#27272a] bg-[#121214] text-[#a1a1aa] hover:text-[#f4f4f5]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-[#d4d4d8]" />
                  <span>Devin (Editor - Adding Cache)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Code Editor Demonstration */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#27272a] bg-[#121214] overflow-hidden shadow-xl">
              {/* Editor Mock Bar */}
              <div className="flex items-center justify-between border-b border-[#27272a] bg-[#18181b] px-4 py-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#f4f4f5]">
                  <span className="text-white">TS</span>
                  <span className="font-medium">queryPipeline.ts</span>
                  <span className="rounded bg-[#09090b] px-1.5 py-0.5 text-[10px] text-[#a1a1aa] border border-[#27272a]">
                    Synced 14ms ago
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-[#09090b] px-2.5 py-1 text-[11px] text-[#a1a1aa] border border-[#27272a]">
                    <Users size={12} className="text-white" />
                    <span>2 users active</span>
                  </span>
                </div>
              </div>

              {/* Code Surface with Dynamic Focus */}
              <div className="p-5 font-mono text-xs leading-relaxed bg-[#09090b] select-none">
                <div className="grid grid-cols-[30px_1fr] gap-4">
                  <div className="text-[#71717a] text-right space-y-1">
                    <div>42</div>
                    <div>43</div>
                    <div>44</div>
                    <div className={activeCollaborator === "elena" ? "text-white font-bold" : ""}>45</div>
                    <div>46</div>
                    <div>47</div>
                    <div className={activeCollaborator === "devin" ? "text-[#d4d4d8] font-bold" : ""}>48</div>
                    <div>49</div>
                    <div>50</div>
                  </div>

                  <div className="space-y-1">
                    <div>
                      <span className="text-[#d4d4d8]">export async function</span>{" "}
                      <span className="text-white">executeBatchQuery</span>(keys: <span className="text-white">string[]</span>) &#123;
                    </div>

                    <div className="pl-4 text-[#a1a1aa]">
                      // Concurrent Yjs transformation test stream
                    </div>

                    <div className="pl-4">
                      <span className="text-[#d4d4d8]">const</span> results = <span className="text-[#d4d4d8]">new</span> Map&lt;<span className="text-white">string</span>, <span className="text-white">Record</span>&gt;();
                    </div>

                    {/* Elena's Line */}
                    <div className={`relative pl-4 rounded transition-colors ${activeCollaborator === "elena" ? "bg-[#1c1c20]/60 border-l-2 border-white" : ""}`}>
                      <span className="text-[#d4d4d8]">const</span> shards = partitionKeysIntoShards(keys, <span className="text-[#FFD166]">16</span>);
                      {activeCollaborator === "elena" && (
                        <div className="absolute -top-3.5 right-6 flex items-center gap-1 rounded bg-white text-black px-1.5 py-0.5 text-[9px] font-bold text-[#09090b] shadow-md">
                          <MousePointer2 size={10} />
                          <span>Elena editing line 45</span>
                        </div>
                      )}
                    </div>

                    <div className="pl-4">
                      <span className="text-[#d4d4d8]">await</span> Promise.all(shards.map(<span className="text-[#d4d4d8]">async</span> (shard) =&gt; &#123;
                    </div>

                    <div className="pl-8 text-[#a1a1aa]">
                      const cached = await redisPool.mget(shard);
                    </div>

                    {/* Devin's Line */}
                    <div className={`relative pl-8 rounded transition-colors ${activeCollaborator === "devin" ? "bg-[#18181b] border-l-2 border-[#d4d4d8]" : ""}`}>
                      <span className="text-[#d4d4d8]">if</span> (!cached || cached.length === <span className="text-[#FFD166]">0</span>) &#123;
                      {activeCollaborator === "devin" && (
                        <div className="absolute -top-3.5 right-6 flex items-center gap-1 rounded bg-[#d4d4d8] px-1.5 py-0.5 text-[9px] font-bold text-[#09090b] shadow-md">
                          <MousePointer2 size={10} />
                          <span>Devin editing line 48</span>
                        </div>
                      )}
                    </div>

                    <div className="pl-12 text-[#a1a1aa]">
                      return databaseReplica.fetchBatch(shard);
                    </div>

                    <div className="pl-4">&#125;));</div>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between border-t border-[#27272a] bg-[#121214] px-4 py-1.5 font-mono text-[11px] text-[#a1a1aa]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span>Conflict Resolution: Automatic CRDT LWW (Last-Write-Wins)</span>
                </div>
                <span className="text-[#71717a]">UTF-8 • Spaces: 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
