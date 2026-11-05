let inMemoryAccessToken: string | null = null;

export function getToken(): string | null {
  return inMemoryAccessToken;
}

export function setToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function clearToken(): void {
  inMemoryAccessToken = null;
  try {
    localStorage.removeItem("confluo.token");
  } catch {
    // Ignore private mode or storage quota errors
  }
}
