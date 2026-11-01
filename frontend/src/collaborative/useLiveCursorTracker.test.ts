// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLiveCursorTracker } from "./useLiveCursorTracker";

const updateMyPresenceMock = vi.fn();

vi.mock("@liveblocks/react/suspense", () => ({
  useUpdateMyPresence: () => updateMyPresenceMock,
}));

describe("useLiveCursorTracker hook", () => {
  it("tracks pointer movement and updates presence with fileId and scroll offset", () => {
    updateMyPresenceMock.mockClear();
    const fakeEditor = {
      getScrollLeft: () => 40,
      getScrollTop: () => 100,
    };
    const { result } = renderHook(() =>
      useLiveCursorTracker({ fileId: "file-abc", editorInstance: fakeEditor }),
    );

    const fakeEvent = {
      clientX: 250,
      clientY: 180,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 50, top: 30 }),
      },
    } as unknown as React.PointerEvent<HTMLDivElement>;

    act(() => {
      result.current.handlePointerMove(fakeEvent);
    });

    // x = 250 - 50 + 40 = 240, y = 180 - 30 + 100 = 250
    expect(updateMyPresenceMock).toHaveBeenCalledWith({
      cursor: { x: 240, y: 250, fileId: "file-abc" },
    });
  });

  it("clears cursor on pointer leave", () => {
    updateMyPresenceMock.mockClear();
    const { result } = renderHook(() => useLiveCursorTracker());

    act(() => {
      result.current.handlePointerLeave();
    });

    expect(updateMyPresenceMock).toHaveBeenCalledWith({ cursor: null });
  });

  it("clears cursor when switching files", () => {
    updateMyPresenceMock.mockClear();
    let currentFile = "file-1";
    const { rerender } = renderHook(() => useLiveCursorTracker({ fileId: currentFile }));

    expect(updateMyPresenceMock).toHaveBeenCalledWith({ cursor: null });

    updateMyPresenceMock.mockClear();
    currentFile = "file-2";
    rerender();

    expect(updateMyPresenceMock).toHaveBeenCalledWith({ cursor: null });
  });

  it("clears cursor on window blur", () => {
    updateMyPresenceMock.mockClear();
    renderHook(() => useLiveCursorTracker());

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(updateMyPresenceMock).toHaveBeenCalledWith({ cursor: null });
  });

  it("hides cursor when user types in Monaco editor", () => {
    updateMyPresenceMock.mockClear();
    let keydownCb: (() => void) | undefined;
    const fakeEditor = {
      getScrollLeft: () => 0,
      getScrollTop: () => 0,
      onKeyDown: (cb: () => void) => {
        keydownCb = cb;
        return { dispose: () => {} };
      },
    };

    renderHook(() =>
      useLiveCursorTracker({ fileId: "file-1", editorInstance: fakeEditor }),
    );

    updateMyPresenceMock.mockClear();

    act(() => {
      keydownCb?.();
    });

    expect(updateMyPresenceMock).toHaveBeenCalledWith({ cursor: null });
  });

  it("hides cursor when global keydown fires inside a textarea or inputarea", () => {
    updateMyPresenceMock.mockClear();
    renderHook(() => useLiveCursorTracker({ fileId: "file-1" }));

    updateMyPresenceMock.mockClear();

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    act(() => {
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "a" }),
      );
    });

    expect(updateMyPresenceMock).toHaveBeenCalledWith({ cursor: null });
    textarea.remove();
  });
});
