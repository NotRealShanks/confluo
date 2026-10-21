export type TabState = {
  openFileIds: string[];
  selectedFileId: string | null;
};

export type TabAction =
  | { type: "select"; fileId: string }
  | { type: "close"; fileId: string }
  | { type: "remove"; fileId: string };

export const initialTabState: TabState = {
  openFileIds: [],
  selectedFileId: null,
};

export function tabReducer(state: TabState, action: TabAction): TabState {
  if (action.type === "select") {
    return {
      openFileIds: state.openFileIds.includes(action.fileId)
        ? state.openFileIds
        : [...state.openFileIds, action.fileId],
      selectedFileId: action.fileId,
    };
  }

  const index = state.openFileIds.indexOf(action.fileId);
  if (index < 0) return state;

  const openFileIds = state.openFileIds.filter((id) => id !== action.fileId);
  const selectedFileId =
    state.selectedFileId !== action.fileId
      ? state.selectedFileId
      : openFileIds[index] ?? openFileIds[index - 1] ?? null;

  return { openFileIds, selectedFileId };
}
