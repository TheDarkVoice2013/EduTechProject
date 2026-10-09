import type { Session } from './types';

let csrfToken = '';
export function rememberSession(session: Session) { csrfToken = session.csrfToken; }

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ApiError'; }
}

export async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const verb = method || (body === undefined ? 'GET' : 'POST');
  const response = await fetch(`${import.meta.env.BASE_URL}api/${path.replace(/^\//, '')}`, {
    method: verb,
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(verb !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error || `The request could not be completed (${response.status}). Please try again.`, response.status);
  if (!data) throw new ApiError('The server returned an unexpected response. Please try again.', response.status);
  return data as T;
}
export function errorText(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
