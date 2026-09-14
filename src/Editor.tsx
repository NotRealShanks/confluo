import { useEffect, useMemo, useState } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness";
import { useRoom } from "@liveblocks/react/suspense";
import { getYjsProviderForRoom } from "@liveblocks/yjs";

type UserAwareness = {
  name: string;
  color: string;
  showName: boolean;
};

function randomName() {
  return `Guest${Math.floor(Math.random() * 1000)}`;
}

function randomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
}

export default function Editor() {
  const room = useRoom();
  const myName = useMemo(randomName, []);
  const myColor = useMemo(randomColor, []);

  const [editorInstance, setEditorInstance] =
    useState<editor.IStandaloneCodeEditor>();

  /*
   * Connect Monaco to the shared Yjs document.
   */
  useEffect(() => {
    if (!editorInstance) return;

    const yProvider = getYjsProviderForRoom(room);
    const yDoc = yProvider.getYDoc();
    const yText = yDoc.getText("monaco");
    const awareness = yProvider.awareness as unknown as Awareness;

    awareness.setLocalStateField("user", {
      name: myName,
      color: myColor,
      showName: false,
    } satisfies UserAwareness);

    const binding = new MonacoBinding(
      yText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      awareness
    );

    return () => {
      binding.destroy();
    };
  }, [editorInstance, room, myName, myColor]);

  /*
   * Show the local user's name while:
   * - typing
   * - selecting text
   *
   * Hide it after 2 seconds of inactivity.
   */
  useEffect(() => {
    if (!editorInstance) return;

    const yProvider = getYjsProviderForRoom(room);
    const awareness = yProvider.awareness as unknown as Awareness;

    let timeout: ReturnType<typeof setTimeout> | undefined;

    const showNameTemporarily = () => {
      awareness.setLocalStateField("user", {
        name: myName,
        color: myColor,
        showName: true,
      } satisfies UserAwareness);

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        awareness.setLocalStateField("user", {
          name: myName,
          color: myColor,
          showName: false,
        } satisfies UserAwareness);
      }, 2000);
    };

    /*
     * Typing.
     */
    const typingDisposable = editorInstance.onKeyDown((event) => {
        const key = event.browserEvent.key;

        const isTyping =
            key.length === 1 ||
            key === "Backspace" ||
            key === "Delete" ||
            key === "Enter" ||
            key === "Tab";

        if (isTyping) {
            showNameTemporarily();
        }
    });

    /*
     * Selecting text.
     */
    const selectionDisposable =
      editorInstance.onDidChangeCursorSelection((event) => {
        const selection = event.selection;

        const hasSelection =
          selection.startLineNumber !== selection.endLineNumber ||
          selection.startColumn !== selection.endColumn;

        if (hasSelection) {
          showNameTemporarily();
        }
      });

    return () => {
      typingDisposable.dispose();
      selectionDisposable.dispose();

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [editorInstance, room, myName, myColor]);

  /*
   * Generate the CSS used by y-monaco for remote cursors.
   */
  useEffect(() => {
    if (!editorInstance) return;

    const yProvider = getYjsProviderForRoom(room);
    const awareness = yProvider.awareness as unknown as Awareness;

    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    const updateStyles = () => {
      const rules: string[] = [];

      awareness.getStates().forEach((state, clientId) => {
        const user = state.user as UserAwareness | undefined;

        if (!user) return;

        rules.push(`
          .yRemoteSelection-${clientId},
          .yRemoteSelectionHead-${clientId} {
            --user-color: ${user.color};
          }

          .yRemoteSelectionHead-${clientId}::after {
            content: ${user.showName ? `"${user.name}"` : '""'};
          }
        `);
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