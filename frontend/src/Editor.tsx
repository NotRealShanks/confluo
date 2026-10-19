import { useEffect, useState } from "react";
import { Editor as MonacoEditor, type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness";
import type { Transaction, YTextEvent } from "yjs";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { colorFor } from "./lib/color";
import { safeCursorColor, safeCursorName } from "./lib/cursorCss";
import { getYjsProviderForRoom } from "@liveblocks/yjs";

type UserState = { name: string; color: string; showName?: boolean };

export default function Editor() {
  const room = useRoom();
  // Identity and permission come from the signed token, not from the client
  const name = useSelf((me) => me.info.name);
  const color = colorFor(useSelf((me) => me.id));
  const readOnly = !useSelf((me) => me.canWrite);
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor>();
  const [monacoInstance, setMonacoInstance] = useState<Monaco>();

  // Set up Yjs doc and MonacoBinding (one-time on editor mount)
  useEffect(() => {
    if (!editorInstance) return;
    const yProvider = getYjsProviderForRoom(room);
    const yDoc = yProvider.getYDoc();
    const yText = yDoc.getText("monaco");
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
  }, [editorInstance, room, name, color]);

  // Show the name tag on this user's own edits and selections, hide after 2s
  useEffect(() => {
    if (!editorInstance || !monacoInstance) return;
    const yProvider = getYjsProviderForRoom(room);
    const yText = yProvider.getYDoc().getText("monaco");
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
  }, [editorInstance, monacoInstance, room, name, color]);

  // Inject dynamic CSS for each user's cursor (color and name)
  useEffect(() => {
    if (!editorInstance) return;
    const yProvider = getYjsProviderForRoom(room);
    const awareness = yProvider.awareness as unknown as Awareness;
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
  }, [editorInstance, room]);

  return (
    <div>
      {readOnly && (
        <p className="mb-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">You have view-only access to this project.</p>
      )}
      <MonacoEditor
        height="70vh"
        defaultLanguage="javascript"
        options={{ readOnly, domReadOnly: readOnly }}
        onMount={(editor, monaco) => {
          setEditorInstance(editor);
          setMonacoInstance(monaco);
        }}
      />
    </div>
  );
}