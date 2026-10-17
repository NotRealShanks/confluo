import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { getProject, listProjects } from "../api/projects";
import type { Project } from "../api/types";
import { useAuth } from "../auth/context";

export type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: T };

export function useProjects() {
  const { signOut } = useAuth();
  const [state, setState] = useState<LoadState<Project[]>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listProjects().then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (cancelled) return;
        // An expired token mid-session sends the user back to /login
        if (error instanceof ApiError && error.status === 401) signOut();
        setState({ status: "error", error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, signOut]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const addProject = useCallback((project: Project) => {
    setState((prev) => (prev.status === "ready" ? { status: "ready", data: [project, ...prev.data] } : prev));
  }, []);

  return { state, reload, addProject };
}

export function useProject(id: string) {
  const { signOut } = useAuth();
  const [state, setState] = useState<LoadState<Project>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProject(id).then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) signOut();
        setState({ status: "error", error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id, attempt, signOut]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, reload };
}
