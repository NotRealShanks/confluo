import { Link } from "react-router";
import AppShell from "../components/AppShell";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../auth/context";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppShell>
      <section className="max-w-2xl rounded-xl border border-[#27272a] bg-[#121214] p-6 sm:p-8 shadow-xl">
        <div className="flex items-start gap-4 pb-6 border-b border-[#27272a]">
          <UserAvatar user={user} className="h-16 w-16 border border-[#27272a]" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#f4f4f5]">
              {user.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-[#a1a1aa]">{user.email}</p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#27272a] bg-[#09090b] px-2.5 py-0.5 font-mono text-[10px] text-white">
              <ShieldCheck size={12} />
              <span>Verified Account</span>
            </div>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-[#27272a] border-y border-[#27272a] font-mono text-xs">
          <div className="flex justify-between items-center py-3">
            <dt className="text-[#a1a1aa]">Authentication Provider</dt>
            <dd className="font-semibold capitalize text-[#f4f4f5]">{user.provider}</dd>
          </div>
          <div className="flex justify-between items-center py-3">
            <dt className="text-[#a1a1aa]">Account Email</dt>
            <dd className="font-medium text-[#f4f4f5]">{user.email}</dd>
          </div>
          <div className="flex justify-between items-center py-3">
            <dt className="text-[#a1a1aa]">Developer UID</dt>
            <dd className="font-medium text-[#71717a]">{user.id}</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center justify-between">
          <Link
            to="/settings/profile"
            className="inline-flex items-center gap-1.5 rounded-md border border-white bg-white text-black px-4 py-2 font-mono text-xs font-semibold text-[#09090b] hover:bg-zinc-200 transition-all"
          >
            <span>Edit Profile Settings</span>
            <ArrowRight size={13} />
          </Link>

          <Link
            to="/dashboard"
            className="font-mono text-xs text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
          >
            ← Back to workspaces
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
