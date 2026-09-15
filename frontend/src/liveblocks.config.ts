// Defines what each user broadcasts about themselves in the room
declare global {
  interface Liveblocks {
    Presence: {
      name: string;
      cursor: number | null;
    };
  }
}

export {};