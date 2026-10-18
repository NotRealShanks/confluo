
import { useEffect, useState } from "react";
import {
  addMember,
  listMembers,
  removeMember,
  updateMemberRole,
  type ProjectMember,
} from "../api/members";

type Props = {
  projectId: string;
  onClose: () => void;
};

export default function ShareDialog({ projectId, onClose }: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [roleMessage, setRoleMessage] = useState<{
    userId: string;
    text: string;
  } | null>(null);
  const [memberToRemove, setMemberToRemove] =
    useState<ProjectMember | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setError("");

      try {
        const data = await listMembers(projectId);
        if (!cancelled) setMembers(data);
      } catch {
        if (!cancelled) setError("Could not load project members.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setAddMessage("");
    setRoleMessage(null);

    try {
      const member = await addMember(projectId, email.trim(), role);
      setMembers((current) => [...current, member]);
      setEmail("");
      setAddMessage("Member added successfully.");
    } catch {
      setError(
        "Could not add member. Check that the email belongs to a registered account and that the user does not already have access.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(
    userId: string,
    nextRole: "EDITOR" | "VIEWER",
  ) {
    if (busy) return;

    setBusy(true);
    setError("");
    setAddMessage("");
    setRoleMessage(null);

    try {
      const updated = await updateMemberRole(projectId, userId, nextRole);

      setMembers((current) =>
        current.map((member) =>
          member.userId === userId ? updated : member,
        ),
      );

      setRoleMessage({
        userId,
        text: `Role updated to ${nextRole === "EDITOR" ? "Editor" : "Viewer"}.`,
      });
    } catch {
      setError("Could not update the member's role.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!memberToRemove || busy) return;

    const member = memberToRemove;
    setBusy(true);
    setError("");
    setAddMessage("");
    setRoleMessage(null);

    try {
      await removeMember(projectId, member.userId);

      setMembers((current) =>
        current.filter((item) => item.userId !== member.userId),
      );

      setMemberToRemove(null);
    } catch {
      setError("Could not remove this member.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
      >
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2
              id="share-title"
              className="text-lg font-semibold text-gray-900"
            >
              Share project
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage who can access this project.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close share dialog"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleAdd} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Email address
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1 text-sm font-medium text-gray-700">
              Role
              <select
                value={role}
                disabled={busy}
                onChange={(event) =>
                  setRole(event.target.value as "EDITOR" | "VIEWER")
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer (read-only)</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {busy ? "Working…" : "Add member"}
            </button>
          </div>
        </form>

        {addMessage && (
          <p
            role="status"
            className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            {addMessage}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-900">
            Project members
            {!loading && (
              <span className="ml-2 font-normal text-gray-500">
                ({members.length})
              </span>
            )}
          </h3>

          {loading ? (
            <p className="py-4 text-sm text-gray-500">Loading members…</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {members.map((member) => (
                <li key={member.userId} className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {member.email ?? "Email unavailable"}
                      </p>
                    </div>

                    {member.role === "OWNER" ? (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        Owner
                      </span>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <select
                          aria-label={`Role for ${member.name}`}
                          value={member.role}
                          disabled={busy}
                          onChange={(event) =>
                            void handleRoleChange(
                              member.userId,
                              event.target.value as "EDITOR" | "VIEWER",
                            )
                          }
                          className="max-w-24 rounded-lg border border-gray-300 px-1.5 py-1.5 text-xs"
                        >
                          <option value="EDITOR">Editor</option>
                          <option value="VIEWER">Viewer</option>
                        </select>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setMemberToRemove(member)}
                          className="rounded-md px-1 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {roleMessage?.userId === member.userId && (
                    <p
                      role="status"
                      className="ml-11 mt-1.5 flex items-center gap-1 text-xs text-green-700"
                    >
                      <span aria-hidden="true">✓</span>
                      {roleMessage.text}
                    </p>
                  )}
                </li>
              ))}

              {members.length === 0 && (
                <li className="py-4 text-sm text-gray-500">
                  No members found.
                </li>
              )}
            </ul>
          )}
        </div>

        <footer className="mt-4 flex justify-end border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Done
          </button>
        </footer>
      </section>

      {memberToRemove && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-member-title"
            aria-describedby="remove-member-description"
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <span className="text-lg font-bold">!</span>
            </div>

            <h3
              id="remove-member-title"
              className="mt-3 text-lg font-semibold text-gray-900"
            >
              Remove member?
            </h3>

            <p
              id="remove-member-description"
              className="mt-2 text-sm leading-6 text-gray-600"
            >
              <strong>{memberToRemove.name}</strong> will lose access to this
              project. You can invite them again later.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setMemberToRemove(null)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRemove()}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Removing…" : "Remove member"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
