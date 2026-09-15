// src/Editor.tsx
import { useEffect, useMemo, useState } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness";
import { useRoom } from "@liveblocks/react/suspense";
import { getYjsProviderForRoom } from "@liveblocks/yjs";

type UserState = { name: string; color: string; showName?: boolean };
function randomName() {
  return `Guest${Math.floor(Math.random() * 1000)}`;
}
function randomColor() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
}

export default function Editor() {
  const room = useRoom();
  const myName = useMemo(randomName, []);
  const myColor = useMemo(randomColor, []);
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
      name: myName,
      color: myColor,
      showName: false
    } satisfies UserState);

    const binding = new MonacoBinding(
      yText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      awareness
    );

    return () => {
      binding.destroy();
      // Optionally, clear awareness state on unmount
    };
  }, [editorInstance, room, myName, myColor]);

  // Show name on typing or selection, hide after 2s
  useEffect(() => {
    if (!editorInstance) return;
    const yProvider = getYjsProviderForRoom(room);
    const awareness = yProvider.awareness as unknown as Awareness;
    let timeout: ReturnType<typeof setTimeout>;

    const showNameNow = () => {
      // Update awareness to show name
      awareness.setLocalStateField("user", { name: myName, color: myColor, showName: true } satisfies UserState);
      clearTimeout(timeout);
      // Hide after 2s idle
      timeout = setTimeout(() => {
        awareness.setLocalStateField("user", { name: myName, color: myColor, showName: false } satisfies UserState);
      }, 2000);
    };

    // Use onDidChangeModelContent for typing/edits
    const dispEdit = editorInstance.onDidChangeModelContent(() => {
      showNameNow();
    });
    // Use onDidChangeCursorSelection for text selection
    const dispSelect = editorInstance.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      const hasSel = (sel.startLineNumber !== sel.endLineNumber) ||
                     (sel.startColumn !== sel.endColumn);
      if (hasSel) {
        showNameNow();
      }
    });

    return () => {
      dispEdit.dispose();
      dispSelect.dispose();
      clearTimeout(timeout);
    };
  }, [editorInstance, room, myName, myColor]);

  // Inject dynamic CSS for each user’s cursor (color and name)
  useEffect(() => {
    if (!editorInstance) return;
    const yProvider = getYjsProviderForRoom(room);
    const awareness = yProvider.awareness as unknown as Awareness;
    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    const updateStyles = () => {
      let css = "";
      awareness.getStates().forEach((state: any, clientId: any) => {
        const user = state.user as UserState | undefined;
        if (!user) return;
        // Set CSS variable for the color
        css += `
          .yRemoteSelection-${clientId}, .yRemoteSelectionHead-${clientId} {
            --user-color: ${user.color};
          }
        `;
        // Display name only if showName is true (empty string otherwise)
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