import { Link } from "react-router";
import AppShell from "../components/AppShell";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../auth/context";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <AppShell>
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4"><UserAvatar user={user} className="h-16 w-16" /><div className="min-w-0"><h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1><p className="mt-1 text-sm text-gray-600">{user.email}</p></div></div>
      <dl className="mt-7 divide-y divide-gray-100 border-y border-gray-100 text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">Sign-in provider</dt><dd className="font-medium capitalize text-gray-900">{user.provider}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">Account email</dt><dd className="font-medium text-gray-900">{user.email}</dd></div></dl>
      <Link to="/settings/profile" className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">Edit profile</Link>
    </section>
  </AppShell>;
}
