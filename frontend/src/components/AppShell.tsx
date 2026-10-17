import type { ReactNode } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/context";

export default function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const width = wide ? "max-w-6xl" : "max-w-3xl";
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className={`mx-auto flex ${width} items-center justify-between px-6 py-3`}>
          <Link to="/" className="text-lg font-semibold text-gray-900">
            Confluo
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-7 w-7 rounded-full" />
            )}
            <span>{user?.name}</span>
            <button onClick={signOut} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className={`mx-auto ${width} px-6 py-8`}>{children}</main>
    </div>
  );
}
