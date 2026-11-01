// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLiveCursorTracker } from "./useLiveCursorTracker";

const updateMyPresenceMock = vi.fn();

vi.mock("@liveblocks/react/suspense", () => ({
  useUpdateMyPresence: () => updateMyPresenceMock,
}));

describe("useLiveCursorTracker hook", () => {
  it("tracks pointer movement and updates presence", () => {
    updateMyPresenceMock.mockClear();
    const { result } = renderHook(() => useLiveCursorTracker());

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

    expect(updateMyPresenceMock).toHaveBeenCalledWith({
      cursor: { x: 200, y: 150 },
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

  it("clears cursor on window blur", () => {
    updateMyPresenceMock.mockClear();
    renderHook(() => useLiveCursorTracker());

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(updateMyPresenceMock).toHaveBeenCalledWith({ cursor: null });
  });
});
