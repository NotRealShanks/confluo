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

// Mirrors the backend ProjectResponse; role is the caller's own role
export type Project = {
  id: string;
  title: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};
