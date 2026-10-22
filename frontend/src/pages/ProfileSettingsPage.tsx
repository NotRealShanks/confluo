import { useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import UserAvatar from "../components/UserAvatar";
import { updateProfile } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/context";

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
    if (!cleaned || cleaned.length > 100) { setError("Display name must be between 1 and 100 characters."); return; }
    setPending(true); setError(""); setNotice("");
    try { updateUser(await updateProfile(cleaned)); setNotice("Profile updated."); }
    catch (cause) { setError(cause instanceof ApiError ? cause.fieldErrors.name ?? cause.message : "Could not save your profile. Please try again."); }
    finally { setPending(false); }
  };
  return <AppShell>
    <section className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h1 className="text-2xl font-semibold text-gray-900">Profile settings</h1><p className="mt-1 text-sm text-gray-600">Update the information shown to collaborators.</p>
      <form className="mt-6 space-y-5" onSubmit={save}><div className="flex items-center gap-3"><UserAvatar user={user} className="h-12 w-12" /><p className="text-sm text-gray-500">Avatar changes are not available yet. Your provider avatar remains in use.</p></div>
        <label className="block text-sm font-medium text-gray-700">Display name<input value={name} onChange={(event) => { setName(event.target.value); setError(""); }} maxLength={100} autoComplete="name" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" /></label>
        <label className="block text-sm font-medium text-gray-500">Email address<input value={user.email} readOnly className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600" /></label>
        <label className="block text-sm font-medium text-gray-500">Sign-in provider<input value={user.provider} readOnly className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 capitalize text-gray-600" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
        <button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Saving…" : "Save changes"}</button>
      </form>
    </section>
  </AppShell>;
}
