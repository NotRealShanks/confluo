import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/context";
import { ArrowRight, Terminal, Menu, X } from "lucide-react";

export function LandingHeader() {
  const { status, user } = useAuth();
  const isAuthenticated = status === "authenticated";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2 group">
            <span className="flex h-7 w-7 items-center justify-center rounded border border-[#27272a] bg-[#121214] text-white font-mono text-xs font-bold transition-colors group-hover:border-white">
              <Terminal size={14} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[#f4f4f5]">
              Confluo
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white ml-1 align-baseline animate-pulse" />
            </span>
          </Link>

          {/* Operational Status Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-2.5 py-0.5 font-mono text-[11px] text-[#a1a1aa]">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span>E2B Sandboxes Online</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-[#a1a1aa]">
          <a href="#problem" className="transition-colors hover:text-[#f4f4f5]">
            The Problem
          </a>
          <a href="#walkthrough" className="transition-colors hover:text-[#f4f4f5]">
            Walkthrough
          </a>
          <a href="#collaboration" className="transition-colors hover:text-[#f4f4f5]">
            Multiplayer CRDT
          </a>
          <a href="#discussions" className="transition-colors hover:text-[#f4f4f5]">
            Inline Threads
          </a>
          <a href="#execution" className="transition-colors hover:text-[#f4f4f5]">
            Sandbox Runtime
          </a>
          <a href="#architecture" className="transition-colors hover:text-[#f4f4f5]">
            Architecture
          </a>
        </nav>

        {/* Action CTAs (Desktop) */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded border border-white bg-white text-black px-3.5 py-1.5 font-mono text-xs font-semibold transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]"
            >
              <span>{user?.name ? `Dashboard (${user.name})` : "Open Dashboard"}</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded border border-[#27272a] bg-[#121214] px-3.5 py-1.5 font-mono text-xs font-medium text-[#f4f4f5] transition-colors hover:border-[#3f3f46] hover:bg-[#18181b]"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded border border-white bg-white text-black px-3.5 py-1.5 font-mono text-xs font-semibold transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]"
              >
                <span>Start building</span>
                <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded border border-white bg-white text-black px-2.5 py-1 font-mono text-xs font-semibold text-[#09090b]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/signup"
              className="rounded border border-white bg-white text-black px-2.5 py-1 font-mono text-xs font-semibold text-[#09090b]"
            >
              Start
            </Link>
          )}

          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="rounded border border-[#27272a] bg-[#121214] p-1.5 text-[#a1a1aa] hover:text-[#f4f4f5]"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[#27272a] bg-[#121214] px-4 py-4 space-y-3 font-mono text-xs animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2 text-[#a1a1aa]">
            <a
              href="#problem"
              onClick={closeMobileMenu}
              className="py-1 hover:text-[#f4f4f5] transition-colors"
            >
              → The Problem
            </a>
            <a
              href="#walkthrough"
              onClick={closeMobileMenu}
              className="py-1 hover:text-[#f4f4f5] transition-colors"
            >
              → Interactive Walkthrough
            </a>
            <a
              href="#collaboration"
              onClick={closeMobileMenu}
              className="py-1 hover:text-[#f4f4f5] transition-colors"
            >
              → Multiplayer CRDT
            </a>
            <a
              href="#discussions"
              onClick={closeMobileMenu}
              className="py-1 hover:text-[#f4f4f5] transition-colors"
            >
              → Inline Threads
            </a>
            <a
              href="#execution"
              onClick={closeMobileMenu}
              className="py-1 hover:text-[#f4f4f5] transition-colors"
            >
              → Sandbox Runtime
            </a>
            <a
              href="#architecture"
              onClick={closeMobileMenu}
              className="py-1 hover:text-[#f4f4f5] transition-colors"
            >
              → Architecture
            </a>
          </nav>

          <div className="pt-3 border-t border-[#27272a] flex flex-col gap-2">
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="text-center rounded border border-[#27272a] bg-[#09090b] py-2 text-[#f4f4f5]"
              >
                Sign In
              </Link>
            )}
            <Link
              to={isAuthenticated ? "/dashboard" : "/signup"}
              onClick={closeMobileMenu}
              className="text-center rounded border border-white bg-white text-black py-2 font-semibold text-[#09090b]"
            >
              {isAuthenticated ? "Open Dashboard" : "Start building"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
