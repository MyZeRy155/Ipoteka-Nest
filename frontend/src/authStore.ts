const ACCESS_KEY = 'ipoteka:access_token';
const REFRESH_KEY = 'ipoteka:refresh_token';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface AccessTokenPayload {
  sub: number;
  username: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(pair: TokenPair): void {
  localStorage.setItem(ACCESS_KEY, pair.access_token);
  localStorage.setItem(REFRESH_KEY, pair.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
