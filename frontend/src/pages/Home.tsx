import { Link } from "react-router";
import type { Project } from "../api/types";
import AppShell from "../components/AppShell";
import NewProjectForm from "../components/NewProjectForm";
import RoleBadge from "../components/RoleBadge";
import { formatDate } from "../lib/format";
import { useProjects } from "../projects/hooks";

function ProjectGroup({ title, projects }: { title: string; projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      <ul className="mt-3 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              to={`/projects/${project.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50"
            >
              <span className="truncate font-medium text-gray-900">{project.title}</span>
              <span className="flex shrink-0 items-center gap-3 text-sm text-gray-500">
                <RoleBadge role={project.role} />
                <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const { state, reload, addProject } = useProjects();

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900">Your projects</h1>
      <NewProjectForm onCreated={addProject} />

      {state.status === "loading" && <p className="mt-8 text-gray-600">Loading projects…</p>}

      {state.status === "error" && (
        <div role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Could not load your projects.{" "}
          <button onClick={reload} className="font-medium underline">
            Try again
          </button>
        </div>
      )}

      {state.status === "ready" && state.data.length === 0 && (
        <p className="mt-8 text-gray-600">No projects yet. Create your first one above.</p>
      )}

      {state.status === "ready" && (
        <>
          <ProjectGroup title="Your projects" projects={state.data.filter((p) => p.role === "OWNER")} />
          <ProjectGroup title="Shared with you" projects={state.data.filter((p) => p.role !== "OWNER")} />
        </>
      )}
    </AppShell>
  );
}
