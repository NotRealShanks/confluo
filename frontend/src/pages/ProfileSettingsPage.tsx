import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router";
import AppShell from "../components/AppShell";
import UserAvatar from "../components/UserAvatar";
import { updateProfile, getSessions, revokeSession, revokeOtherSessions, type UserSession } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/context";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Laptop,
  Smartphone,
  Shield,
  ShieldCheck,
  Trash2,
  LogOut,
  PlusCircle,
  Edit3,
  Layers,
  Sparkles,
  Info,
  Clock,
  MapPin,
  RefreshCw,
} from "lucide-react";

type SettingsTab = "profile" | "sessions" | "capabilities";

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile Form State
  const [name, setName] = useState(user?.name ?? "");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Sessions State
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionActionPending, setSessionActionPending] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    setSessionNotice(null);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // fallback
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSessionActionPending(true);
    setSessionNotice(null);
    try {
      await revokeSession(sessionId);
      setSessionNotice("Device session was successfully terminated.");
      await fetchSessions();
    } catch {
      setSessionNotice("Failed to revoke session. Please try again.");
    } finally {
      setSessionActionPending(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setSessionActionPending(true);
    setSessionNotice(null);
    try {
      await revokeOtherSessions();
      setSessionNotice("All other device sessions were terminated.");
      await fetchSessions();
    } catch {
      setSessionNotice("Failed to revoke sessions.");
    } finally {
      setSessionActionPending(false);
    }
  };

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

  const getDeviceIcon = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes("mobile") || lower.includes("iphone") || lower.includes("android")) {
      return <Smartphone className="h-5 w-5 text-zinc-400" />;
    }
    return <Laptop className="h-5 w-5 text-zinc-400" />;
  };

  return (
    <AppShell wide>
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <Sparkles size={13} className="text-zinc-400" />
          <span>Account & Security Console</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="mt-6 mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f4f5]">
          Account & Workspace Settings
        </h1>
        <p className="mt-1.5 text-xs text-zinc-400 font-mono">
          Manage your personal collaborator profile, active device sessions, and platform capabilities.
        </p>
      </div>

      {/* StackBlitz-Style Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#27272a] mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 font-mono text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "profile"
              ? "border-white text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <UserAvatar user={user} className="h-4 w-4" />
          <span>Profile & Account</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2.5 font-mono text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "sessions"
              ? "border-white text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span>Active Device Sessions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("capabilities")}
          className={`px-4 py-2.5 font-mono text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "capabilities"
              ? "border-white text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-sky-400" />
          <span>What You Can Add, Edit & Remove</span>
        </button>
      </div>

      {/* Tab 1: Profile & Identity */}
      {activeTab === "profile" && (
        <section className="max-w-2xl rounded-xl border border-[#27272a] bg-[#121214] p-6 sm:p-8 shadow-xl">
          <div className="pb-4 border-b border-[#27272a]">
            <h2 className="font-display text-lg font-bold tracking-tight text-[#f4f4f5]">
              Personal Identity
            </h2>
            <p className="mt-1 text-xs text-[#a1a1aa] font-mono">
              Update your public collaborator identity and preferences.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={save}>
            <div className="flex items-center gap-4 rounded-lg border border-[#27272a] bg-[#09090b] p-3.5">
              <UserAvatar user={user} className="h-12 w-12 border border-[#27272a]" />
              <div className="text-xs font-mono">
                <span className="font-semibold text-[#f4f4f5]">Collaborator Avatar</span>
                <p className="text-[#71717a] text-[11px] mt-0.5">
                  Synchronized with your {user.provider} credentials.
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
                Authentication Provider
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
                className="rounded-md border border-white bg-white text-black px-4 py-2 font-mono text-xs font-semibold hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {pending ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab 2: Active Sessions & Devices (StackBlitz Security UX) */}
      {activeTab === "sessions" && (
        <section className="max-w-3xl rounded-xl border border-[#27272a] bg-[#121214] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272a]">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-[#f4f4f5] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Where You're Logged In</span>
              </h2>
              <p className="mt-1 text-xs text-[#a1a1aa] font-mono">
                Inspect and manage all active browser sessions and devices registered to your account.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchSessions}
                disabled={loadingSessions}
                title="Refresh sessions"
                className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw size={14} className={loadingSessions ? "animate-spin" : ""} />
              </button>

              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                disabled={sessionActionPending || sessions.filter((s) => !s.current && s.status === "ACTIVE").length === 0}
                className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 font-mono text-xs text-red-300 hover:bg-red-900/30 hover:border-red-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Revoke All Other Devices
              </button>
            </div>
          </div>

          {sessionNotice && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-950/30 p-3 font-mono text-xs text-emerald-300">
              <CheckCircle2 size={14} />
              <span>{sessionNotice}</span>
            </div>
          )}

          {/* Sessions List */}
          <div className="mt-6 space-y-3">
            {loadingSessions ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-500">
                Loading recognized device sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-500">
                No active device sessions found.
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.status === "ACTIVE";
                return (
                  <div
                    key={sess.id}
                    className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      sess.current
                        ? "border-emerald-500/40 bg-[#161a18]"
                        : isActive
                        ? "border-[#27272a] bg-[#0c0c0e]"
                        : "border-zinc-800/40 bg-zinc-950/40 opacity-50"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 shrink-0 mt-0.5">
                        {getDeviceIcon(sess.deviceInfo)}
                      </div>
                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {sess.deviceInfo || "Web Browser"}
                          </span>
                          {sess.current && (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold">
                              This Device
                            </span>
                          )}
                          {!isActive && (
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                              {sess.status.toLowerCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                          {sess.ipAddress && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-zinc-500" />
                              <span>{sess.ipAddress}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-zinc-500" />
                            <span>
                              {sess.current ? "Active now" : `Last active ${new Date(sess.lastUsedAt || sess.createdAt).toLocaleDateString()}`}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {!sess.current && isActive && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        disabled={sessionActionPending}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-mono text-xs text-zinc-300 hover:text-red-300 hover:border-red-500/40 hover:bg-red-950/20 disabled:opacity-40 transition-colors"
                      >
                        <LogOut size={13} />
                        <span>Sign Out Device</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Security Guarantee Note */}
          <div className="mt-6 rounded-lg border border-zinc-800 bg-[#09090b] p-4 font-mono text-xs text-zinc-400 flex items-start gap-3">
            <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-200">Device Security Policy:</span>
              <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">
                Confluo enforces single active device sessions with cryptographically hashed opaque refresh tokens,
                token rotation, and instant SSE push displacement when another browser signs in.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Platform Capabilities Guide (What You Can Add, Edit, Remove) */}
      {activeTab === "capabilities" && (
        <section className="space-y-6 max-w-4xl">
          {/* Card: What You Can Add */}
          <div className="rounded-xl border border-emerald-500/20 bg-[#121214] p-6 shadow-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#27272a]">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PlusCircle size={16} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white">What You Can Add</h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Capabilities, integrations, and starter assets you can introduce into your workspace.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">1. Modern Starter Templates</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Boot up clean starter workspaces for React (TS/JS), Vue 3, Angular 19, Node/Express, and Vanilla Web.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">2. npm Dependencies</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Inject frontend and backend packages (Tailwind, Lucide, Axios, Zustand, Framer Motion) directly into your package.json.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">3. Remote Git Repositories</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Link an external GitHub or GitLab repository to push and pull collaborative commits using Personal Access Tokens.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">4. Live Collaborators & Roles</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Invite teammates by email with granular role permissions: Owner, Editor, or Viewer.
                </p>
              </div>
            </div>
          </div>

          {/* Card: What You Can Edit */}
          <div className="rounded-xl border border-sky-500/20 bg-[#121214] p-6 shadow-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#27272a]">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Edit3 size={16} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white">What You Can Edit</h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Customizable parameters, code styling, and development settings.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">1. Display Name & Avatar</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Customize your collaborator handle and display preferences across the live room.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">2. Monaco Editor Themes & Fonts</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Switch between VS Code Dark+, GitHub Dark, One Dark Pro, Dracula; customize font family and tab size.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">3. Git Branches & Staged Files</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Create branches, stage or unstage changes, and craft commit messages right in the integrated Source Control pane.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">4. Collaborative Code & Comments</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Real-time multi-cursor editing, inline code review discussions, and unresolved feedback threads.
                </p>
              </div>
            </div>
          </div>

          {/* Card: What You Can Remove */}
          <div className="rounded-xl border border-red-500/20 bg-[#121214] p-6 shadow-xl">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#27272a]">
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <Trash2 size={16} />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white">What You Can Remove</h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Disconnection, member removal, and safe project deletion safeguards.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">1. Sign Out Remote Devices</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Terminate unrecognized or old device sessions instantly via the Active Device Sessions tab.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">2. Revoke Project Collaborators</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Remove project members and revoke their Liveblocks collaborative room access instantly.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">3. Discard Working Tree Changes</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Revert uncommitted modifications to match the clean HEAD branch state.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-[#161619] p-3.5">
                <span className="font-semibold text-white block">4. Danger Zone: Delete Workspace</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Project Owners can permanently delete workspaces after confirming with exact project title matching.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
