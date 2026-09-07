import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  type TokenPair,
} from './authStore';

export type { TokenPair };

export interface MortgageResult {
  interestRate: number;
  mortgageAmount: number;
  mortgageTermMonths: number;
  monthlyPayment: number;
  totalDebt: number;
  overPayment: number;
  id?: number;
}

export interface CalculateMortgageInput {
  interestRate: number;
  mortgageAmount: number;
  mortgageTermMonths: number;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UserSummary {
  id: number;
  username: string;
  createdAt: string;
}

export interface WhitelistIp {
  id: number;
  ipAddress: string;
  label: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  id: number;
  userId: number | null;
  ipAddress: string;
  countryCode: string | null;
  method: string;
  requestedUrl: string;
  statusCode: number;
  createdAt: string;
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  userId?: number;
  ipAddress?: string;
  statusCode?: number;
  method?: string;
  from?: string;
  to?: string;
}

export interface CurrencyRates {
  baseCurrency: string;
  rates: Record<string, number>;
  source: string;
  fetchedAt: string;
  sourceUpdatedAt: string;
}

export interface SourceHealth {
  status: 'up' | 'down';
  latencyMs: number;
  checkedAt: string;
  totalChecks: number;
  totalFailures: number;
  consecutiveFailures: number;
  availability: number;
}

export interface CompareReport {
  moreActual: string | null;
  sources: {
    source: string;
    available: boolean;
    data: CurrencyRates | null;
  }[];
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function rawRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      body?.message ?? `Запрос завершился с ошибкой ${response.status}`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(null);

  if (!refreshPromise) {
    refreshPromise = rawRequest<TokenPair>(
      '/auth/refresh',
      { method: 'POST' },
      refreshToken,
    )
      .then((pair) => {
        setTokens(pair);
        return pair.access_token;
      })
      .catch(() => {
        clearTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Authenticated request. Retries once via /auth/refresh on a 401. */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken() ?? undefined;
  try {
    return await rawRequest<T>(path, options, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && getRefreshToken()) {
      const newToken = await refreshAccessToken();
      if (newToken) return rawRequest<T>(path, options, newToken);
    }
    throw err;
  }
}

// --- auth ---

export function login(username: string, password: string): Promise<TokenPair> {
  return rawRequest<TokenPair>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function register(
  username: string,
  password: string,
): Promise<TokenPair> {
  return rawRequest<TokenPair>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<TokenPair> {
  return request<TokenPair>('/auth/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// --- mortgage ---

export function getCalculations(
  page: number,
  limit: number,
): Promise<MortgageResult[]> {
  return request<MortgageResult[]>(`/calculations?page=${page}&limit=${limit}`);
}

export function calculateMortgage(
  input: CalculateMortgageInput,
): Promise<MortgageResult> {
  return request<MortgageResult>('/calculate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// --- users (admin) ---

export function getUsers(
  page: number,
  limit: number,
): Promise<PagedResult<UserSummary>> {
  return request(`/users?page=${page}&limit=${limit}`);
}

export function resetUserPassword(id: number): Promise<void> {
  return request(`/users/${id}/reset-password`, { method: 'POST' });
}

export function blockUser(id: number): Promise<void> {
  return request(`/users/${id}/block-user`, { method: 'POST' });
}

export function unblockUser(id: number): Promise<void> {
  return request(`/users/${id}/unblock-user`, { method: 'POST' });
}

// --- whitelist (admin) ---

export function getWhitelist(): Promise<WhitelistIp[]> {
  return request('/whitelist');
}

export function createWhitelistIp(
  ipAddress: string,
  label?: string,
): Promise<WhitelistIp> {
  return request('/whitelist', {
    method: 'POST',
    body: JSON.stringify({ ipAddress, label: label || undefined }),
  });
}

export function updateWhitelistIp(
  id: number,
  label: string,
): Promise<WhitelistIp> {
  return request(`/whitelist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ label }),
  });
}

export function deleteWhitelistIp(id: number): Promise<void> {
  return request(`/whitelist/${id}`, { method: 'DELETE' });
}

// --- audit (admin) ---

export function getAuditLogs(
  query: AuditLogQuery,
): Promise<PagedResult<AuditLogEntry>> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return request(`/audit?${params.toString()}`);
}

// --- currency ---

export function getCurrencyRate(currency: string): Promise<CurrencyRates> {
  return request(`/currency/currencies/${currency}`);
}

export function getCurrencyHealth(): Promise<Record<string, SourceHealth>> {
  return request('/currency/health');
}

export function compareCurrencySources(): Promise<CompareReport> {
  return request('/currency/compare/rub');
}

export { ApiError };
