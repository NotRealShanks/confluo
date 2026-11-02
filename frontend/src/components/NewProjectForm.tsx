import { useState, type FormEvent } from "react";
import { createProject } from "../api/projects";
import { ApiError } from "../api/client";
import type { Project } from "../api/types";
import { Plus, AlertCircle } from "lucide-react";

export default function NewProjectForm({ onCreated }: { onCreated: (project: Project) => void }) {
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const trimmed = title.trim();
    if (!trimmed) {
      setError("Enter a project title.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      onCreated(await createProject(trimmed));
      setTitle("");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.fieldErrors.title ?? e.message);
      } else {
        setError("Could not reach the server. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <label htmlFor="new-project-title" className="sr-only">
          Project title
        </label>
        <div className="relative flex-1">
          <input
            id="new-project-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
            maxLength={200}
            placeholder="e.g. distributed-consensus, auth-service, rust-engine..."
            aria-invalid={error ? true : undefined}
            className="block w-full rounded-md border border-[#27272a] bg-[#09090b] px-3.5 py-2 font-mono text-xs text-[#f4f4f5] placeholder-[#71717a] transition-colors focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white bg-white text-black px-4 py-2 font-mono text-xs font-semibold text-[#09090b] transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255, 255, 255, )] disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={14} />
          <span>{pending ? "Creating…" : "New Project"}</span>
        </button>
      </div>
      {error && (
        <div role="alert" className="mt-2.5 flex items-center gap-1.5 font-mono text-xs text-[#FF6B6B]">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
