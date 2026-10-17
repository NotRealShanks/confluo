// Presence is only for cursors; identity comes from the signed Liveblocks token
declare global {
  interface Liveblocks {
    Presence: {
      cursor: number | null;
    };
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
      };
    };
  }
}

export {};
