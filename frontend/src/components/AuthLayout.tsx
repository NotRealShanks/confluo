import type { ReactNode } from "react";
import { Link } from "react-router";
import { Terminal, ArrowLeft } from "lucide-react";

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-12 selection:bg-white text-black selection:text-[#09090b]">
      {/* Background Technical Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#303B3418_1px,transparent_1px),linear-gradient(to_bottom,#303B3418_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Main Card */}
      <div className="relative w-full max-w-md rounded-xl border border-[#27272a] bg-[#121214] p-6 sm:p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#27272a]">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="flex h-7 w-7 items-center justify-center rounded border border-[#27272a] bg-[#09090b] text-white font-mono text-xs font-bold transition-colors group-hover:border-white">
              <Terminal size={14} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[#f4f4f5]">
              Confluo
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white ml-1 align-baseline animate-pulse" />
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1 font-mono text-xs text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Home</span>
          </Link>
        </div>

        {/* Title & Context */}
        <div className="mt-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#f4f4f5]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-xs text-[#a1a1aa] leading-relaxed">{subtitle}</p>}
        </div>

        {/* Children Form & Actions */}
        <div className="mt-6">{children}</div>
      </div>

      {/* Footer Meta */}
      <div className="mt-8 text-center font-mono text-[11px] text-[#71717a]">
        <span>Protected by enterprise-grade cryptographic authentication</span>
      </div>
    </main>
  );
}
