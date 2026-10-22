import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Braces } from "lucide-react";
import { ApiError } from "../api/client";
import { exchangeShareToken } from "../api/shareLinks";
import { Room } from "../Room";
import { RoomErrorBoundary } from "../components/RoomErrorBoundary";
import { CollaborativeWorkspace } from "./ProjectPage";

export default function GuestProjectPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; token: string; project: Awaited<ReturnType<typeof exchangeShareToken>>["project"] }
  >(() => token
    ? { status: "loading" }
    : { status: "error", message: "This share link is invalid or unavailable." });

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    void exchangeShareToken(token).then(
      (session) => {
        if (!cancelled) setState({ status: "ready", ...session });
      },
      (error: unknown) => {
        if (cancelled) return;
        const message = error instanceof ApiError && error.status === 429
          ? "Too many attempts. Please try again later."
          : "This share link is invalid, expired, or revoked.";
        setState({ status: "error", message });
      },
    );
    return () => { cancelled = true; };
  }, [token]);

  if (state.status === "loading") return <div className="ide-loading">Validating share link…</div>;
  if (state.status === "error") return <div className="ide-error" role="alert">{state.message} <Link to="/login">Sign in</Link></div>;

  return (
    <div className="ide-shell">
      <RoomErrorBoundary>
        <Room projectId={state.project.id} accessToken={state.token}>
          <header className="ide-header">
            <Link to="/" className="ide-brand"><Braces size={18} /> Confluo</Link>
            <span className="ide-header-divider" />
            <strong className="ide-project-name">{state.project.title}</strong>
            <div className="ide-header-spacer" />
            <span className="ide-guest-badge">Guest · View only</span>
          </header>
          <CollaborativeWorkspace projectId={state.project.id} canInitialize={false} canRun={false} />
        </Room>
      </RoomErrorBoundary>
    </div>
  );
}
