import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { ApiError } from "../api/client";
import Editor from "../Editor";
import Presence from "../Presence";
import { Room } from "../Room";
import AppShell from "../components/AppShell";
import RoleBadge from "../components/RoleBadge";
import { RoomErrorBoundary } from "../components/RoomErrorBoundary";
import ShareDialog from "../components/ShareDialog";
import { useProject } from "../projects/hooks";
import WorkspaceExplorer from "../workspace/WorkspaceExplorer";
import { ensureWorkspace } from "../workspace/ops";
import { useRoom } from "@liveblocks/react/suspense";

function CollaborativeWorkspace() {
  const room = useRoom();
  const provider = getYjsProviderForRoom(room);
  const doc = provider.getYDoc();
  const [ready, setReady] = useState(provider.synced);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    const onSynced = (synced: boolean) => {
      if (!synced) {
        setReady(false);
        return;
      }
      ensureWorkspace(doc);
      setReady(true);
    };
    provider.on("synced", onSynced);
    if (provider.synced) onSynced(true);
    return () => provider.off("synced", onSynced);
  }, [doc, provider]);

  return (
    <div className="grid gap-3 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <WorkspaceExplorer
        doc={doc}
        ready={ready}
        selectedFileId={selectedFileId}
        onSelectFile={(id) => setSelectedFileId(id || null)}
      />
      <Editor doc={doc} fileId={selectedFileId} workspaceReady={ready} />
    </div>
  );
}

function ProjectView({ id }: { id: string }) {
  const { state, reload } = useProject(id);
  const [shareOpen, setShareOpen] = useState(false);

  if (state.status === "loading") {
    return <p className="text-gray-600">Loading project…</p>;
  }

  if (state.status === "error") {
    const notFound =
      state.error instanceof ApiError && state.error.status === 404;

    return (
      <div
        role="alert"
        className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
      >
        {notFound
          ? "Project not found, or you don't have access to it."
          : "Could not load the project."}{" "}
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
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="truncate text-2xl font-semibold text-gray-900">
          {project.title}
        </h1>

        <RoleBadge role={project.role} />

        {project.role === "OWNER" && (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="ml-auto rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Share
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <RoomErrorBoundary>
          <Room projectId={project.id}>
            <Presence />
            <CollaborativeWorkspace />
          </Room>
        </RoomErrorBoundary>
      </div>

      {shareOpen && project.role === "OWNER" && (
        <ShareDialog
          projectId={project.id}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <AppShell wide>
      <Link
        to="/"
        className="mb-4 inline-block text-sm text-blue-600 underline"
      >
        ← All projects
      </Link>

      {id ? (
        <ProjectView key={id} id={id} />
      ) : (
        <p className="text-gray-600">Missing project id.</p>
      )}
    </AppShell>
  );
}
