import { describe, expect, it } from "vitest";
import { tabReducer, type TabState } from "./tabState";

describe("tabReducer", () => {
  it("selects files without duplicating open tabs", () => {
    const selected = tabReducer({ openFileIds: ["one"], selectedFileId: "one" }, { type: "select", fileId: "one" });
    expect(selected).toEqual({ openFileIds: ["one"], selectedFileId: "one" });
  });

  it("selects the adjacent tab when closing the active tab", () => {
    const state: TabState = { openFileIds: ["one", "two", "three"], selectedFileId: "two" };
    expect(tabReducer(state, { type: "close", fileId: "two" })).toEqual({
      openFileIds: ["one", "three"],
      selectedFileId: "three",
    });
  });
});
