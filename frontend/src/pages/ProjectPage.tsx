import { Link, useParams } from "react-router";
import { ApiError } from "../api/client";
import AppShell from "../components/AppShell";
import RoleBadge from "../components/RoleBadge";
import { useProject } from "../projects/hooks";

function ProjectView({ id }: { id: string }) {
  const { state, reload } = useProject(id);

  if (state.status === "loading") {
    return <p className="text-gray-600">Loading project…</p>;
  }

  if (state.status === "error") {
    // The backend answers 404 for both missing projects and non-members
    const notFound = state.error instanceof ApiError && state.error.status === 404;
    return (
      <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {notFound ? "Project not found, or you don't have access to it." : "Could not load the project."}{" "}
        {!notFound && (
          <button onClick={reload} className="font-medium underline">
            Try again
          </button>
        )}
      </div>
    );
  }

  const project = state.data;
  return (
    <>
      <div className="flex items-center gap-3">
        <h1 className="truncate text-2xl font-semibold text-gray-900">{project.title}</h1>
        <RoleBadge role={project.role} />
      </div>
      <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        The editor for this project arrives in the next step.
      </p>
    </>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-block text-sm text-blue-600 underline">
        ← All projects
      </Link>
      {/* key resets the loading state when navigating between projects */}
      {id ? <ProjectView key={id} id={id} /> : <p className="text-gray-600">Missing project id.</p>}
    </AppShell>
  );
}
