import type { ReactNode } from "react";
import { Link } from "react-router";
import AccountMenu from "./AccountMenu";

export default function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const width = wide ? "max-w-6xl" : "max-w-3xl";
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className={`mx-auto flex ${width} items-center justify-between px-6 py-3`}>
          <Link to="/" className="text-lg font-semibold text-gray-900">
            Confluo
          </Link>
          <AccountMenu />
        </div>
      </header>
      <main className={`mx-auto ${width} px-6 py-8`}>{children}</main>
    </div>
  );
}
