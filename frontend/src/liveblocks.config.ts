// Presence tracks live mouse cursors, active file, and status; identity comes from the signed Liveblocks token
declare global {
  interface Liveblocks {
    Presence: {
      cursor: {
        x: number;
        y: number;
        fileId: string | null;
      } | null;
      activeFileId?: string | null;
    };
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
      };
    };
    RoomEvent: {
      type: "CHAT_MESSAGE";
      messageId: string;
    };
  }
}

export {};
