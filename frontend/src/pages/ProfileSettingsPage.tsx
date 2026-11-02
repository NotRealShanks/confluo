import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import AppShell from "../components/AppShell";
import UserAvatar from "../components/UserAvatar";
import { updateProfile } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/context";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  if (!user) return null;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const cleaned = name.trim();
    if (!cleaned || cleaned.length > 100) {
      setError("Display name must be between 1 and 100 characters.");
      return;
    }
    setPending(true);
    setError("");
    setNotice("");
    try {
      updateUser(await updateProfile(cleaned));
      setNotice("Profile updated successfully.");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.fieldErrors.name ?? cause.message
          : "Could not save your profile. Please try again."
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <AppShell>
      <section className="max-w-2xl rounded-xl border border-[#27272a] bg-[#121214] p-6 sm:p-8 shadow-xl">
        <div className="pb-4 border-b border-[#27272a]">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#f4f4f5]">
            Profile Settings
          </h1>
          <p className="mt-1 text-xs text-[#a1a1aa] font-mono">
            Update your public collaborator identity and preferences.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={save}>
          <div className="flex items-center gap-4 rounded-lg border border-[#27272a] bg-[#09090b] p-3.5">
            <UserAvatar user={user} className="h-12 w-12 border border-[#27272a]" />
            <div className="text-xs font-mono">
              <span className="font-semibold text-[#f4f4f5]">Provider Avatar</span>
              <p className="text-[#71717a] text-[11px] mt-0.5">
                Your profile picture is synchronized with your {user.provider} identity.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-medium text-[#f4f4f5] mb-1.5">
              Display Name
            </label>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              maxLength={100}
              autoComplete="name"
              placeholder="Your name"
              className="block w-full rounded-md border border-[#27272a] bg-[#09090b] px-3.5 py-2 font-mono text-xs text-[#f4f4f5] placeholder-[#71717a] focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-medium text-[#a1a1aa] mb-1.5">
              Email Address (Read-only)
            </label>
            <input
              value={user.email}
              readOnly
              className="block w-full cursor-not-allowed rounded-md border border-[#27272a]/60 bg-[#09090b]/60 px-3.5 py-2 font-mono text-xs text-[#71717a]"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-medium text-[#a1a1aa] mb-1.5">
              Sign-in Provider
            </label>
            <input
              value={user.provider}
              readOnly
              className="block w-full cursor-not-allowed rounded-md border border-[#27272a]/60 bg-[#09090b]/60 px-3.5 py-2 font-mono text-xs capitalize text-[#71717a]"
            />
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-md border border-[#FF6B6B]/40 bg-[#2A1515] p-3 font-mono text-xs text-[#FF6B6B]">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div role="status" className="flex items-center gap-2 rounded-md border border-white/40 bg-[#1c1c20] p-3 font-mono text-xs text-white">
              <CheckCircle2 size={14} />
              <span>{notice}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md border border-white bg-white text-black px-4 py-2 font-mono text-xs font-semibold text-[#09090b] hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {pending ? "Saving…" : "Save Changes"}
            </button>

            <Link
              to="/profile"
              className="inline-flex items-center gap-1 font-mono text-xs text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to profile</span>
            </Link>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
