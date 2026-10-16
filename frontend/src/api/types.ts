export type Role = "OWNER" | "EDITOR" | "VIEWER";

// Mirrors the backend UserResponse
export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: string;
};

// Mirrors the backend AuthResponse
export type AuthResponse = {
  token: string;
  user: User;
};
