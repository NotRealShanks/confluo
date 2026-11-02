import { Lock, Key, Link as LinkIcon, Check } from "lucide-react";

export function ProjectsSection() {
  return (
    <section id="projects" className="relative border-t border-[#27272a] bg-[#121214]/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3 py-1 font-mono text-xs text-[#a1a1aa] mb-4">
            <span className="text-[#d4d4d8]">05</span>
            <span className="text-[#71717a]">/</span>
            <span>Shared Project Workspaces</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f4f5]">
            Granular access controls, instant workspace invitations.
          </h2>

          <p className="mt-4 text-base text-[#a1a1aa] leading-relaxed">
            Organize work into collaborative projects. Invite teammates via email or generate secure read-only/editor share tokens to review code without complex permission onboarding.
          </p>
        </div>

        {/* Roles Breakdown Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. OWNER */}
          <div className="rounded-xl border border-[#27272a] bg-[#09090b] p-6 flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="rounded bg-[#1c1c20] px-2 py-0.5 font-mono text-xs font-semibold text-white border border-[#27272a]">
                  OWNER
                </span>
                <Lock size={15} className="text-white" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#f4f4f5]">Project Administration</h3>
              <p className="mt-2 text-xs text-[#a1a1aa] leading-relaxed">
                Complete authority over project lifecycle, member role modifications, deletion, and token generation.
              </p>
              <ul className="mt-4 space-y-2 text-xs font-mono text-[#a1a1aa]">
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-white" />
                  <span>Invite & remove members</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-white" />
                  <span>Promote to Editor or Viewer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-white" />
                  <span>Execute code in cloud sandbox</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-3 border-t border-[#27272a] text-[11px] font-mono text-[#71717a]">
              Full Privileges
            </div>
          </div>

          {/* 2. EDITOR */}
          <div className="rounded-xl border border-[#27272a] bg-[#09090b] p-6 flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="rounded bg-[#18181b] px-2 py-0.5 font-mono text-xs font-semibold text-[#d4d4d8] border border-[#27272a]">
                  EDITOR
                </span>
                <Key size={15} className="text-[#d4d4d8]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#f4f4f5]">Collaborative Development</h3>
              <p className="mt-2 text-xs text-[#a1a1aa] leading-relaxed">
                Full real-time editing privileges, terminal execution commands, and participation in inline code discussions.
              </p>
              <ul className="mt-4 space-y-2 text-xs font-mono text-[#a1a1aa]">
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#d4d4d8]" />
                  <span>Live multi-file code editing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#d4d4d8]" />
                  <span>Cloud sandbox run triggers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#d4d4d8]" />
                  <span>Comment creation & replies</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-3 border-t border-[#27272a] text-[11px] font-mono text-[#71717a]">
              Active Engineering
            </div>
          </div>

          {/* 3. VIEWER / GUEST */}
          <div className="rounded-xl border border-[#27272a] bg-[#09090b] p-6 flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="rounded bg-[#18181b] px-2 py-0.5 font-mono text-xs font-semibold text-[#a1a1aa] border border-[#27272a]">
                  VIEWER & GUEST
                </span>
                <LinkIcon size={15} className="text-[#a1a1aa]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#f4f4f5]">Auditing & Review</h3>
              <p className="mt-2 text-xs text-[#a1a1aa] leading-relaxed">
                Instant token links for reviewers and clients to inspect code and follow collaborators with zero write risk.
              </p>
              <ul className="mt-4 space-y-2 text-xs font-mono text-[#a1a1aa]">
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#a1a1aa]" />
                  <span>Read-only Monaco workspace</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#a1a1aa]" />
                  <span>Live collaborator cursor following</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#a1a1aa]" />
                  <span>Token expiration & revocation</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-3 border-t border-[#27272a] text-[11px] font-mono text-[#71717a]">
              Zero-Trust Guarded
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
