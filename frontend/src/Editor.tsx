import { useEffect, useState } from "react";
import { Editor as MonacoEditor, type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness";
import type { Transaction, YTextEvent } from "yjs";
import type * as Y from "yjs";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { colorFor } from "./lib/color";
import { safeCursorColor, safeCursorName } from "./lib/cursorCss";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { getFileText } from "./workspace/ops";

type UserState = { name: string; color: string; showName?: boolean };

type EditorProps = {
  doc?: Y.Doc;
  fileId?: string | null;
  workspaceReady?: boolean;
  emptyWorkspace?: boolean;
  onCreateFile?: () => void;
};

export default function Editor({
  doc,
  fileId,
  workspaceReady = true,
  emptyWorkspace = false,
  onCreateFile,
}: EditorProps) {
  const room = useRoom();
  // Identity and permission come from the signed token, not from the client
  const name = useSelf((me) => me.info.name);
  const color = colorFor(useSelf((me) => me.id));
  const readOnly = !useSelf((me) => me.canWrite);
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor>();
  const [monacoInstance, setMonacoInstance] = useState<Monaco>();
  const [mountedFileId, setMountedFileId] = useState<string | null | undefined>(fileId);

  // Set up Yjs doc and MonacoBinding (one-time on editor mount)
  useEffect(() => {
    if (!editorInstance || mountedFileId !== fileId) return;
    const yProvider = getYjsProviderForRoom(room);
    if (!workspaceReady) return;
    const yDoc = doc ?? yProvider.getYDoc();
    const yText = fileId ? getFileText(yDoc, fileId) : yDoc.getText("monaco");
    if (!yText) return;
    const awareness = yProvider.awareness as unknown as Awareness;

    // Initialize local user in awareness with name/color (showName starts false)
    awareness.setLocalStateField("user", {
      name,
      color,
      showName: false,
    } satisfies UserState);

    const binding = new MonacoBinding(
      yText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      awareness
    );

    return () => {
      binding.destroy();
    };
  }, [doc, editorInstance, fileId, mountedFileId, room, name, color, workspaceReady]);

  // Show the name tag on this user's own edits and selections, hide after 2s
  useEffect(() => {
    if (!editorInstance || !monacoInstance || mountedFileId !== fileId) return;
    const yProvider = getYjsProviderForRoom(room);
    const yDoc = doc ?? yProvider.getYDoc();
    const yText = fileId ? getFileText(yDoc, fileId) : yDoc.getText("monaco");
    if (!yText) return;
    const awareness = yProvider.awareness as unknown as Awareness;
    let timeout: ReturnType<typeof setTimeout>;

    const showNameNow = () => {
      awareness.setLocalStateField("user", { name, color, showName: true } satisfies UserState);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        awareness.setLocalStateField("user", { name, color, showName: false } satisfies UserState);
      }, 2000);
    };

    // Remote edits also change the Monaco model, so watch Yjs: only local transactions are ours
    const onTextChange = (_event: YTextEvent, transaction: Transaction) => {
      if (transaction.local) {
        showNameNow();
      }
    };
    yText.observe(onTextChange);

    const dispSelect = editorInstance.onDidChangeCursorSelection((e) => {
      // Remote edits shift cursors too; only an explicit user gesture counts
      if (e.reason !== monacoInstance.editor.CursorChangeReason.Explicit) return;
      const sel = e.selection;
      const hasSel =
        sel.startLineNumber !== sel.endLineNumber || sel.startColumn !== sel.endColumn;
      if (hasSel) {
        showNameNow();
      }
    });

    return () => {
      yText.unobserve(onTextChange);
      dispSelect.dispose();
      clearTimeout(timeout);
    };
  }, [doc, editorInstance, fileId, mountedFileId, monacoInstance, room, name, color, workspaceReady]);

  // Inject dynamic CSS for each user's cursor (color and name)
  useEffect(() => {
    const yProvider = getYjsProviderForRoom(room);
    const awareness = yProvider.awareness as unknown as Awareness;
    awareness.setLocalStateField("user", {
      name,
      color,
      showName: false,
    } satisfies UserState);
    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    const updateStyles = () => {
      let css = "";
      awareness.getStates().forEach((state, clientId) => {
        const user = state.user as UserState | undefined;
        if (!user) return;

        // Name and color come from another browser, so both are sanitized before entering CSS
        const label = user.showName ? safeCursorName(user.name) : "";
        css += `
          .yRemoteSelection-${clientId}, .yRemoteSelectionHead-${clientId} {
            --user-color: ${safeCursorColor(user.color)};
          }
        `;
        css += `
          .yRemoteSelectionHead-${clientId}::after {
            content: "${label}";
          }
        `;
      });
      styleEl.textContent = css;
    };

    awareness.on("change", updateStyles);
    updateStyles();

    return () => {
      awareness.off("change", updateStyles);
      styleEl.remove();
    };
  }, [color, name, room]);

  return (
    <div className="ide-editor">
      {readOnly && (
        <p className="ide-readonly-notice">You have view-only access to this project.</p>
      )}
      {fileId && workspaceReady ? (
        <div className="ide-monaco">
          <MonacoEditor
            key={fileId}
            height="100%"
            defaultLanguage="javascript"
            defaultValue=""
            path={`workspace/${fileId}`}
            options={{
              readOnly,
              domReadOnly: readOnly,
              minimap: { enabled: false },
              padding: { top: 12 },
              scrollBeyondLastLine: false,
            }}
            onMount={(editor, monaco) => {
              setMountedFileId(fileId);
              setEditorInstance(editor);
              setMonacoInstance(monaco);
            }}
          />
        </div>
      ) : (
        <div className="ide-empty-editor">
          <strong>{workspaceReady && emptyWorkspace ? "No files in this workspace" : workspaceReady ? "No file selected" : "Synchronizing workspace…"}</strong>
          <span>{workspaceReady && emptyWorkspace ? "Create a file to start editing." : workspaceReady ? "Select a file from Explorer to start editing." : "Your workspace will appear when synchronization finishes."}</span>
          {workspaceReady && emptyWorkspace && onCreateFile && (
            <button type="button" className="ide-empty-editor-action" onClick={onCreateFile}>
              New File
            </button>
          )}
        </div>
      )}
    </div>
  );
}