import { useState, type FormEvent } from "react";
import { createProject } from "../api/projects";
import { ApiError } from "../api/client";
import type { Project } from "../api/types";

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
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="flex gap-3">
        <label htmlFor="new-project-title" className="sr-only">
          Project title
        </label>
        <input
          id="new-project-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="New project title"
          aria-invalid={error ? true : undefined}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create project"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
