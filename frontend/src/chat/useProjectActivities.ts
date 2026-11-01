import { useCallback, useEffect, useState } from "react";
import {
  fetchProjectActivities,
  type ProjectActivity,
} from "../api/activity";
import { ApiError } from "../api/client";

export interface UseProjectActivitiesOptions {
  projectId: string;
  enabled?: boolean;
}

export function useProjectActivities({ projectId, enabled = true }: UseProjectActivitiesOptions) {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(() => Boolean(enabled && projectId));
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled || !projectId) return;
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
    });

    fetchProjectActivities(projectId, 0, 20)
      .then((res) => {
        if (!active) return;
        setActivities(res.activities);
        setHasMore(res.hasMore);
        setPage(0);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
          setError("You do not have permission to view project activity.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load project activity.");
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId, enabled, refreshKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await fetchProjectActivities(projectId, nextPage, 20);
      setActivities((prev) => [...prev, ...res.activities]);
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more activity.");
    } finally {
      setLoadingMore(false);
    }
  }, [projectId, page, hasMore, loadingMore]);

  const refresh = useCallback(async () => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    activities,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}
