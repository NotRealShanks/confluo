import { useEffect, useMemo, useState } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness";
import { useRoom } from "@liveblocks/react/suspense";
import { getYjsProviderForRoom } from "@liveblocks/yjs";

// Generates a random guest label for anonymous users
function randomName() {
  return `Guest${Math.floor(Math.random() * 1000)}`;
}

export default function Editor() {
  const room = useRoom();
  const myName = useMemo(randomName, []);
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor>();

  // Binds Monaco to the shared Yjs document and tags my cursor with a name/color
  useEffect(() => {
    if (!editorInstance) return;

    const yProvider = getYjsProviderForRoom(room);
    const yDoc = yProvider.getYDoc();
    const yText = yDoc.getText("monaco");
    const awareness = yProvider.awareness as unknown as Awareness;

    awareness.setLocalStateField("user", {
      name: myName,
      color: "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"),
    });

    const binding = new MonacoBinding(
      yText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      awareness
    );

    return () => binding.destroy();
  }, [editorInstance, room]);

  // Injects a colored CSS rule per connected user's clientId
  useEffect(() => {
    if (!editorInstance) return;

    const yProvider = getYjsProviderForRoom(room);
    const awareness = yProvider.awareness as unknown as Awareness;
    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    const updateStyles = () => {
      const rules: string[] = [];
      awareness.getStates().forEach((state, clientId) => {
        const color = state.user?.color;
        if (!color) return;
        rules.push(`.yRemoteSelection-${clientId} { background-color: ${color}55; }`);
        rules.push(`.yRemoteSelectionHead-${clientId} { border-left: 2px solid ${color}; }`);
      });
      styleEl.textContent = rules.join("\n");
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