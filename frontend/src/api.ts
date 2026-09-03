export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

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

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

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

export function login(username: string, password: string): Promise<TokenPair> {
  return request<TokenPair>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function register(
  username: string,
  password: string,
): Promise<TokenPair> {
  return request<TokenPair>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getCalculations(
  page: number,
  limit: number,
  token: string,
): Promise<MortgageResult[]> {
  return request<MortgageResult[]>(
    `/calculations?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export function calculateMortgage(
  input: CalculateMortgageInput,
  token: string,
): Promise<MortgageResult> {
  return request<MortgageResult>('/calculate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}

export { ApiError };
