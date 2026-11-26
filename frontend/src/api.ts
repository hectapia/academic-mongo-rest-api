import type { AcademicRecord, AuthStatus, RecordPayload, Resource } from './types';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001')
  .replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError('Could not reach the API. Check that the backend is running.', 0);
  }

  if (!response.ok) {
    const body = await response.text();
    let message = body || `Request failed (${response.status}).`;
    try {
      const payload = JSON.parse(body) as { error?: string; message?: string };
      message = payload.error || payload.message || message;
    } catch {
      // The API can return plain-text validation messages.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

export const getRecords = (resource: Resource): Promise<AcademicRecord[]> =>
  request<AcademicRecord[]>(`/${resource}`);

export const getAuthStatus = (): Promise<AuthStatus> =>
  request<AuthStatus>('/auth/status');

export const createRecord = (resource: Resource, payload: RecordPayload): Promise<void> =>
  request<void>(`/${resource}`, { method: 'POST', body: JSON.stringify(payload) });

export const updateRecord = (
  resource: Resource,
  id: string,
  payload: RecordPayload,
): Promise<void> =>
  request<void>(`/${resource}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteRecord = (resource: Resource, id: string): Promise<void> =>
  request<void>(`/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const getLoginUrl = (): string => `${apiBaseUrl}/login`;
export const getLogoutUrl = (): string => `${apiBaseUrl}/logout`;
