import { Layers, Database, Cpu, Radio } from "lucide-react";

export function ArchitectureSection() {
  return (
    <section id="architecture" className="relative border-t border-[#27272a] bg-[#09090b] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3 py-1 font-mono text-xs text-[#a1a1aa] mb-4">
            <span className="text-white">06</span>
            <span className="text-[#71717a]">/</span>
            <span>Engineering Architecture</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f4f5]">
            Built with modern, production-grade systems.
          </h2>

          <p className="mt-4 text-base text-[#a1a1aa] leading-relaxed">
            No mock abstractions or simulated layers. Confluo's architecture combines mathematical CRDT guarantees with Spring Boot enterprise security and hardware-isolated micro-VM runtimes.
          </p>
        </div>

        {/* 4-Layer Architecture Pipeline */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Layer 1: Client Canvas */}
          <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5 flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="font-mono text-xs text-white font-semibold">01. CLIENT</span>
                <Layers size={16} className="text-white" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-[#f4f4f5]">React 19 & Monaco</h3>
              <p className="mt-2 text-xs text-[#a1a1aa] leading-relaxed">
                VS Code-grade code editing powered by Monaco Editor, Vite bundling, and Tailwind CSS v4 design tokens.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">React 19</span>
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">Monaco</span>
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">TypeScript</span>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-[#27272a] text-[11px] font-mono text-[#71717a]">
              Sub-frame UI rendering
            </div>
          </div>

          {/* Layer 2: Real-time Mesh */}
          <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5 flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="font-mono text-xs text-[#d4d4d8] font-semibold">02. SYNC MESH</span>
                <Radio size={16} className="text-[#d4d4d8]" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-[#f4f4f5]">Liveblocks & Yjs CRDTs</h3>
              <p className="mt-2 text-xs text-[#a1a1aa] leading-relaxed">
                Peer-to-peer state vector propagation over low-latency WebSockets with character-level operational convergence.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">Yjs CRDT</span>
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">Liveblocks</span>
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">Presence</span>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-[#27272a] text-[11px] font-mono text-[#71717a]">
              Conflict-free mathematical sync
            </div>
          </div>

          {/* Layer 3: Backend & Data */}
          <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5 flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="font-mono text-xs text-[#FFD166] font-semibold">03. BACKEND</span>
                <Database size={16} className="text-[#FFD166]" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-[#f4f4f5]">Spring Boot 4 & Mongo</h3>
              <p className="mt-2 text-xs text-[#a1a1aa] leading-relaxed">
                Java 25 enterprise API layer enforcing stateless JWT authentication, OAuth2, granular role authorization, and audit feeds.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">Spring Boot 4</span>
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">Java 25</span>
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">MongoDB</span>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-[#27272a] text-[11px] font-mono text-[#71717a]">
              OWASP Top 10 hardened
            </div>
          </div>

          {/* Layer 4: Execution Sandbox */}
          <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5 flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="font-mono text-xs text-white font-semibold">04. SANDBOX</span>
                <Cpu size={16} className="text-white" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-[#f4f4f5]">E2B Cloud Micro-VMs</h3>
              <p className="mt-2 text-xs text-[#a1a1aa] leading-relaxed">
                Hardware-isolated micro-VM runtimes executing untrusted code with constant-time token auth and output caps.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">E2B VM</span>
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">Timing-Safe</span>
                <span className="rounded bg-[#18181b] px-2 py-0.5 text-[#f4f4f5] border border-[#27272a]">Bounded IO</span>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-[#27272a] text-[11px] font-mono text-[#71717a]">
              Complete container isolation
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
