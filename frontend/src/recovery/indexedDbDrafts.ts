export interface LocalDraft {
  userId: string;
  projectId: string;
  fileId: string;
  content: string;
  updatedAt: number;
}

const DB_NAME = "confluo_drafts_db";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function makeKey(userId: string, projectId: string, fileId: string): string {
  return `${userId}:${projectId}:${fileId}`;
}

export async function saveLocalDraft(
  userId: string,
  projectId: string,
  fileId: string,
  content: string,
): Promise<void> {
  try {
    const db = await openDb();
    const key = makeKey(userId, projectId, fileId);
    const draft = {
      key,
      userId,
      projectId,
      fileId,
      content,
      updatedAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(draft);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Best effort local storage
  }
}

export async function getLocalDraft(
  userId: string,
  projectId: string,
  fileId: string,
): Promise<LocalDraft | null> {
  try {
    const db = await openDb();
    const key = makeKey(userId, projectId, fileId);

    return await new Promise<LocalDraft | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result ? (req.result as LocalDraft) : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteLocalDraft(
  userId: string,
  projectId: string,
  fileId: string,
): Promise<void> {
  try {
    const db = await openDb();
    const key = makeKey(userId, projectId, fileId);

    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Best effort cleanup
  }
}

