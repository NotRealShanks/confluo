import { Link } from "react-router";
import { useAuth } from "../auth/context";

// Placeholder until the project dashboard
export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Confluo</h1>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <span>{user?.name}</span>
          <button onClick={signOut} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100">
            Sign out
          </button>
        </div>
      </header>

      <p className="mt-6 text-gray-600">Signed in with {user?.provider}. Projects come next.</p>
      <Link to="/sandbox" className="mt-4 inline-block text-blue-600 underline">
        Open the unsecured sandbox editor
      </Link>
    </main>
  );
}
