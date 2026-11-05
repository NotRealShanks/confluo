import { useEffect, useRef, useState, useCallback } from "react";
import { deleteLocalDraft, getLocalDraft, saveLocalDraft } from "./indexedDbDrafts";
import { deleteRemoteDraft, getRemoteDraft, saveRemoteDraft } from "./recoveryApi";

export interface RecoveredDraftState {
  content: string;
  timestamp: string;
}

interface UseEditorRecoveryParams {
  userId?: string | null;
  projectId?: string | null;
  fileId?: string | null;
  currentContent?: string;
  onApplyContent?: (content: string) => void;
  onCreateCopy?: (copyName: string, content: string) => void;
}

export function useEditorRecovery({
  userId,
  projectId,
  fileId,
  currentContent = "",
  onApplyContent,
  onCreateCopy,
}: UseEditorRecoveryParams) {
  const [recoveredDraft, setRecoveredDraft] = useState<RecoveredDraftState | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  const localDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteSyncTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedContent = useRef<string>(currentContent);
  const currentContentRef = useRef<string>(currentContent);
  currentContentRef.current = currentContent;

  // Auto-dismiss if live content matches recovered draft
  useEffect(() => {
    if (recoveredDraft && currentContent && recoveredDraft.content.trim() === currentContent.trim()) {
      setRecoveredDraft(null);
      if (userId && projectId && fileId) {
        void deleteLocalDraft(userId, projectId, fileId);
        void deleteRemoteDraft(projectId, fileId);
      }
    }
  }, [currentContent, recoveredDraft, userId, projectId, fileId]);

  // Check for recovered draft when switching files
  useEffect(() => {
    if (!userId || !projectId || !fileId) {
      setRecoveredDraft(null);
      return;
    }

    let active = true;

    async function checkForDraft() {
      // 1. Try local IndexedDB
      const local = await getLocalDraft(userId!, projectId!, fileId!);
      if (!active) return;

      const live = currentContentRef.current;

      if (local && local.content) {
        // If draft matches the live collaborative document, clear it out
        if (local.content.trim() === live.trim()) {
          void deleteLocalDraft(userId!, projectId!, fileId!);
          void deleteRemoteDraft(projectId!, fileId!);
          setRecoveredDraft(null);
          return;
        }

        // Only show if the document has loaded and genuinely differs
        if (live && local.content.trim() !== live.trim()) {
          setRecoveredDraft({
            content: local.content,
            timestamp: new Date(local.updatedAt).toLocaleTimeString(),
          });
          return;
        }
      }

      // 2. Try remote backend drafts
      try {
        const remote = await getRemoteDraft(projectId!, fileId!);
        if (!active) return;

        if (remote && remote.content) {
          if (remote.content.trim() === live.trim()) {
            void deleteRemoteDraft(projectId!, fileId!);
            setRecoveredDraft(null);
            return;
          }

          if (live && remote.content.trim() !== live.trim()) {
            setRecoveredDraft({
              content: remote.content,
              timestamp: new Date(remote.updatedAt).toLocaleTimeString(),
            });
          }
        }
      } catch {
        // Non-blocking: remote draft fetch failure
      }
    }

    void checkForDraft();

    return () => {
      active = false;
    };
  }, [userId, projectId, fileId]);

  // Debounced save to IndexedDB (5s) to avoid aggressive drafting
  useEffect(() => {
    if (!userId || !projectId || !fileId || !currentContent) return;
    if (currentContent === lastSavedContent.current) return;

    if (localDebounceTimer.current) {
      clearTimeout(localDebounceTimer.current);
    }

    localDebounceTimer.current = setTimeout(() => {
      void saveLocalDraft(userId, projectId, fileId, currentContent);
      lastSavedContent.current = currentContent;
    }, 5000);

    return () => {
      if (localDebounceTimer.current) {
        clearTimeout(localDebounceTimer.current);
      }
    };
  }, [userId, projectId, fileId, currentContent]);

  // Background sync to backend (every 60s)
  useEffect(() => {
    if (!userId || !projectId || !fileId) return;

    remoteSyncTimer.current = setInterval(() => {
      if (lastSavedContent.current) {
        void saveRemoteDraft(projectId, fileId, lastSavedContent.current).catch(() => {});
      }
    }, 60000);

    return () => {
      if (remoteSyncTimer.current) {
        clearInterval(remoteSyncTimer.current);
      }
    };
  }, [userId, projectId, fileId]);

  const discardDraft = useCallback(async () => {
    if (!userId || !projectId || !fileId) return;
    setRecoveredDraft(null);
    setShowDiffModal(false);
    await deleteLocalDraft(userId, projectId, fileId);
    await deleteRemoteDraft(projectId, fileId);
  }, [userId, projectId, fileId]);

  const applyDraft = useCallback(() => {
    if (!recoveredDraft) return;
    onApplyContent?.(recoveredDraft.content);
    setRecoveredDraft(null);
    setShowDiffModal(false);
    if (userId && projectId && fileId) {
      void deleteLocalDraft(userId, projectId, fileId);
      void deleteRemoteDraft(projectId, fileId);
    }
  }, [recoveredDraft, onApplyContent, userId, projectId, fileId]);

  const restoreAsCopy = useCallback(() => {
    if (!recoveredDraft || !fileId) return;
    const parts = fileId.split(".");
    const ext = parts.length > 1 ? `.${parts.pop()}` : "";
    const base = parts.join(".");
    const copyName = `${base}.recovered${ext}`;

    onCreateCopy?.(copyName, recoveredDraft.content);
    setRecoveredDraft(null);
    setShowDiffModal(false);
    if (userId && projectId && fileId) {
      void deleteLocalDraft(userId, projectId, fileId);
      void deleteRemoteDraft(projectId, fileId);
    }
  }, [recoveredDraft, fileId, onCreateCopy, userId, projectId]);

  return {
    recoveredDraft,
    showDiffModal,
    openDiffModal: () => setShowDiffModal(true),
    closeDiffModal: () => setShowDiffModal(false),
    applyDraft,
    restoreAsCopy,
    discardDraft,
  };
}
