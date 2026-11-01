import { useCallback, useEffect, useState } from "react";
import { Editor as MonacoEditor, type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness";
import type { Transaction, YTextEvent } from "yjs";
import * as Y from "yjs";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { colorFor } from "./lib/color";
import { safeCursorColor, safeCursorName } from "./lib/cursorCss";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { getFileText, snapshot } from "./workspace/ops";
import { languageForFilename } from "./workspace/language";
import { downloadAsset } from "./api/assets";
import { useSettings, registerMonacoThemes } from "./settings";
import { Code2 } from "lucide-react";
import { useCodeComments, EditorGutterComments } from "./comments";

type UserState = { name: string; color: string; showName?: boolean };
type MountedEditor = { fileId: string | null | undefined; editor: editor.IStandaloneCodeEditor; monaco: Monaco };

type EditorProps = {
  doc?: Y.Doc;
  projectId?: string;
  fileId?: string | null;
  workspaceReady?: boolean;
  emptyWorkspace?: boolean;
  onCreateFile?: () => void;
  onEditorMount?: (editor: editor.IStandaloneCodeEditor | null) => void;
  focusCommentLine?: number | null;
  onClearFocusCommentLine?: () => void;
};

export default function Editor({
  doc,
  projectId,
  fileId,
  workspaceReady = true,
  emptyWorkspace = false,
  onCreateFile,
  onEditorMount,
  focusCommentLine,
  onClearFocusCommentLine,
}: EditorProps) {
  const room = useRoom();
  // Identity and permission come from the signed token, not from the client
  const name = useSelf((me) => me.info.name);
  const selfId = useSelf((me) => me.id);
  const canWrite = useSelf((me) => me.canWrite);
  const color = colorFor(selfId);
  const readOnly = !canWrite;
  const {
    threadsByLine,
    addThreadOnLine,
    replyToThread,
    resolveThread,
    unresolveThread,
    removeThread,
  } = useCodeComments({ fileId });
  const [mountedEditor, setMountedEditor] = useState<MountedEditor>();
  const editorInstance = mountedEditor?.editor;
  const monacoInstance = mountedEditor?.monaco;
  const mountedFileId = mountedEditor?.fileId;
  const fileName = fileId && doc ? snapshot(doc).nodes.get(fileId)?.name : undefined;
  const fileNode = fileId && doc ? snapshot(doc).nodes.get(fileId) : undefined;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const { settings, monacoTheme } = useSettings();
  const language = fileName ? languageForFilename(fileName) : "plaintext";

  // Reset mounted editor reference whenever the selected file changes so stale or
  // disposed instances are never accessed across file switches.
  useEffect(() => {
    setMountedEditor(undefined);
  }, [fileId]);

  useEffect(() => {
    onEditorMount?.(editorInstance ?? null);
    return () => {
      onEditorMount?.(null);
    };
  }, [editorInstance, onEditorMount]);

  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
       setMountedEditor({ fileId, editor, monaco });
    },
    [fileId],
  );

  useEffect(() => {
    let active = true;
    if (fileNode?.kind !== "binary" || !fileNode.assetId || !projectId) {
      setPdfUrl(null);
      setPdfError(null);
      return;
    }
    setPdfError(null);
    void downloadAsset(projectId, fileNode.assetId)
      .then((blob) => {
        if (active) setPdfUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (active) setPdfUrl(null);
        if (active) setPdfError("This PDF could not be loaded. It may have been deleted or you may not have access.");
      });
    return () => {
      active = false;
      setPdfUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [fileNode?.assetId, fileNode?.kind, projectId]);

  // Automatically heal missing text entry in contentsMap for a known file node
  useEffect(() => {
    if (!fileId || !workspaceReady || readOnly) return;
    const yDoc = doc ?? getYjsProviderForRoom(room).getYDoc();
    const node = snapshot(yDoc).nodes.get(fileId);
    if (node?.type === "file" && node.kind !== "binary") {
      if (!getFileText(yDoc, fileId)) {
        yDoc.getMap("contents").set(fileId, new Y.Text(""));
      }
    }
  }, [doc, fileId, readOnly, room, workspaceReady]);

  // Set up Yjs doc and MonacoBinding (one-time on editor mount)
  useEffect(() => {
        if (!editorInstance || mountedFileId !== fileId) return;
    const yProvider = getYjsProviderForRoom(room);
    if (!workspaceReady) return;
    const yDoc = doc ?? yProvider.getYDoc();
    let yText = fileId ? getFileText(yDoc, fileId) : yDoc.getText("monaco");

    // Automatically heal missing text entry in contentsMap for a known file node
    if (!yText && fileId && !readOnly) {
      const node = snapshot(yDoc).nodes.get(fileId);
      if (node?.type === "file" && node.kind !== "binary") {
        yDoc.getMap("contents").set(fileId, new Y.Text(""));
        yText = getFileText(yDoc, fileId);
      }
    }

    if (!yText) return;
    const awareness = yProvider.awareness as unknown as Awareness;

    // Initialize local user in awareness with name/color (showName starts false)
    awareness.setLocalStateField("user", {
      name,
      color,
      showName: false,
    } satisfies UserState);

    // Guard against disposed models during fast tab/file transitions
    const model = editorInstance.getModel();
    if (!model || (typeof (model as { isDisposed?: () => boolean }).isDisposed === "function" && (model as { isDisposed: () => boolean }).isDisposed())) {
      return;
    }

    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editorInstance]),
      awareness,
    );

    return () => {
      binding.destroy();
    };
  }, [doc, editorInstance, fileId, mountedFileId, room, name, color, readOnly, workspaceReady]);

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

  const isPdf = Boolean(
    fileNode &&
      (fileNode.mimeType === "application/pdf" ||
        (fileNode.name && /\.pdf$/i.test(fileNode.name))),
  );

  return (
    <div className="ide-editor">
      {readOnly && (
        <p className="ide-readonly-notice">You have view-only access to this project.</p>
      )}
      {fileId && workspaceReady && fileNode?.kind === "binary" ? (
        pdfError ? (
          <div className="ide-empty-editor">{pdfError}</div>
        ) : fileNode.assetId && projectId && pdfUrl ? (
          <iframe
            className="ide-pdf-preview"
            title={fileNode.name}
            src={pdfUrl}
          />
        ) : isPdf ? (
          <div className="ide-empty-editor">
            <strong>Loading PDF preview…</strong>
            <span>Fetching asset content.</span>
          </div>
        ) : (
          <div className="ide-empty-editor">
            <strong>Binary file</strong>
            <span>"{fileNode.name}" cannot be edited in the text editor.</span>
          </div>
        )
      ) : fileId && workspaceReady ? (
        <div className="ide-monaco">
          <MonacoEditor
            key={fileId}
            height="100%"
            theme={monacoTheme}
            beforeMount={registerMonacoThemes}
            language={language}
            defaultLanguage={language}
            defaultValue=""
            path={fileName ? `workspace/${fileId}/${fileName}` : `workspace/${fileId}`}
            options={{
              readOnly,
              domReadOnly: readOnly,
              fontSize: settings.fontSize,
              fontFamily: settings.fontFamily,
              tabSize: settings.tabSize,
              insertSpaces: settings.insertSpaces,
              wordWrap: settings.wordWrap,
              lineNumbers: settings.lineNumbers,
              automaticLayout: true,
              minimap: {
                enabled: settings.minimap,
                renderCharacters: true,
                side: "right",
                showSlider: "always",
                autohide: "none",
                maxColumn: 120,
              },
              cursorBlinking: settings.cursorBlinking,
              bracketPairColorization: { enabled: settings.bracketPairColorization },
              renderWhitespace: settings.renderWhitespace,
              padding: { top: 12 },
              scrollBeyondLastLine: false,
            }}
            onMount={handleEditorMount}
          />
          {editorInstance && (
            <EditorGutterComments
              editor={editorInstance}
              fileId={fileId}
              readOnly={readOnly}
              threadsByLine={threadsByLine}
              onAddComment={addThreadOnLine}
              onReply={replyToThread}
              onResolve={resolveThread}
              onUnresolve={unresolveThread}
              onDeleteThread={removeThread}
              currentUserId={selfId}
              focusLine={focusCommentLine}
              onClearFocusLine={onClearFocusCommentLine}
            />
          )}
        </div>
      ) : (
        <div className="ide-empty-editor">
          <div className="ide-empty-editor-card">
            <Code2 size={36} className="ide-empty-icon" strokeWidth={1.5} />
            <strong>{workspaceReady && emptyWorkspace ? "No files in this workspace" : workspaceReady ? "No file selected" : "Connecting to workspace…"}</strong>
            <span>{workspaceReady && emptyWorkspace ? "Create a file to start editing." : workspaceReady ? "Select a file from the explorer sidebar to begin editing." : "Your workspace will appear when synchronization finishes."}</span>
            {workspaceReady && emptyWorkspace && onCreateFile && (
              <button type="button" className="ide-empty-editor-action" onClick={onCreateFile}>
                + New File
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
