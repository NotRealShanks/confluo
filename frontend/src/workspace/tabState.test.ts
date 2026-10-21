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

  it("removes remotely deleted files and selects the next valid tab", () => {
    const state: TabState = { openFileIds: ["one", "two", "three"], selectedFileId: "two" };
    expect(tabReducer(state, { type: "reconcile", validFileIds: ["one", "three"] })).toEqual({
      openFileIds: ["one", "three"],
      selectedFileId: "three",
    });
  });

  it("clears the editor selection when the last open file is deleted", () => {
    expect(tabReducer(
      { openFileIds: ["one"], selectedFileId: "one" },
      { type: "reconcile", validFileIds: [] },
    )).toEqual({ openFileIds: [], selectedFileId: null });
  });

  it("repairs an invalid selection even when all open tabs are valid", () => {
    const state: TabState = { openFileIds: ["one", "two"], selectedFileId: "missing" };
    expect(tabReducer(state, { type: "reconcile", validFileIds: ["one", "two"] })).toEqual({
      openFileIds: ["one", "two"],
      selectedFileId: "one",
    });
  });

  it("clears an invalid selection when no valid open tabs remain", () => {
    const state: TabState = { openFileIds: ["one"], selectedFileId: "missing" };
    expect(tabReducer(state, { type: "reconcile", validFileIds: [] })).toEqual({
      openFileIds: [],
      selectedFileId: null,
    });
  });
});
