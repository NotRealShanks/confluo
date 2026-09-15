import { useEffect, useState } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness";
import { useRoom } from "@liveblocks/react/suspense";
import { getYjsProviderForRoom } from "@liveblocks/yjs";

type UserState = { name: string; color: string; showName?: boolean };

export default function Editor({ name, color }: { name: string; color: string }) {
  const room = useRoom();
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor>();

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

  // Show name on typing or selection, hide after 2s
  useEffect(() => {
    if (!editorInstance) return;
    const yProvider = getYjsProviderForRoom(room);
    const awareness = yProvider.awareness as unknown as Awareness;
    let timeout: ReturnType<typeof setTimeout>;

    const showNameNow = () => {
      awareness.setLocalStateField("user", { name, color, showName: true } satisfies UserState);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        awareness.setLocalStateField("user", { name, color, showName: false } satisfies UserState);
      }, 2000);
    };

    // Fires only on actual content changes, not every keypress
    const dispEdit = editorInstance.onDidChangeModelContent(() => {
      showNameNow();
    });

    const dispSelect = editorInstance.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      const hasSel =
        sel.startLineNumber !== sel.endLineNumber || sel.startColumn !== sel.endColumn;
      if (hasSel) {
        showNameNow();
      }
    });

    return () => {
      dispEdit.dispose();
      dispSelect.dispose();
      clearTimeout(timeout);
    };
  }, [editorInstance, room, name, color]);

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

        css += `
          .yRemoteSelection-${clientId}, .yRemoteSelectionHead-${clientId} {
            --user-color: ${user.color};
          }
        `;
        css += `
          .yRemoteSelectionHead-${clientId}::after {
            content: ${user.showName ? `"${user.name}"` : '""'};
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
    <MonacoEditor
      height="500px"
      defaultLanguage="javascript"
      onMount={(editor) => setEditorInstance(editor)}
    />
  );
}