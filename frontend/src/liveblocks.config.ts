// Presence tracks live mouse cursors and active status; identity comes from the signed Liveblocks token
declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
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
