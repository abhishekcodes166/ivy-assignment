const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://solve.ivy.homes';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

export const STORAGE_KEY = 'ivy.session';

export interface Session {
  accessToken: string;
  refreshToken: string;
  email: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }

  /** True when re-authenticating could plausibly fix this. */
  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

/**
 * The API reports validation failures as FastAPI's `detail` array and everything
 * else as a `detail` string, so both shapes collapse to one readable sentence.
 */
function messageFromBody(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((d: { loc?: unknown[]; msg?: string }) => {
        const field = Array.isArray(d.loc) ? d.loc.filter((p) => p !== 'query' && p !== 'body').join('.') : '';
        return field ? `${field}: ${d.msg}` : d.msg;
      })
      .filter(Boolean);
    if (parts.length) return parts.join('; ');
  }

  switch (status) {
    case 400:
      return 'The request was rejected as invalid.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have access to this resource.';
    case 404:
      return 'We could not find what you were looking for.';
    case 422:
      return 'Some of the values sent were not valid.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return status >= 500
        ? 'The Ivy Homes API is having trouble right now.'
        : `Request failed with status ${status}.`;
  }
}

let session: Session | null = null;

export function getSession(): Session | null {
  if (session) return session;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    session = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session = null;
  }
  return session;
}

export function setSession(next: Session | null) {
  session = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode) - the in-memory session still works */
  }
}

type Listener = () => void;
const expiryListeners = new Set<Listener>();

/** Notified when the refresh token is also dead and the user must sign in again. */
export function onSessionExpired(fn: Listener) {
  expiryListeners.add(fn);
  return () => expiryListeners.delete(fn);
}

function notifyExpired() {
  setSession(null);
  expiryListeners.forEach((fn) => fn());
}

export interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
  /** Skips the bearer header and the refresh-on-401 retry. */
  anonymous?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { 'X-API-Key': API_KEY };

  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  if (!options.anonymous) {
    const current = getSession();
    if (current) headers.Authorization = `Bearer ${current.accessToken}`;
  }

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
}

let refreshInFlight: Promise<boolean> | null = null;

/** Single-flight so a burst of parallel 401s triggers exactly one refresh. */
async function refreshSession(): Promise<boolean> {
  const current = getSession();
  if (!current?.refreshToken) return false;

  refreshInFlight ??= (async () => {
    try {
      const res = await rawRequest('/auth/refresh', {
        method: 'POST',
        body: { refresh_token: current.refreshToken },
        anonymous: true,
      });
      if (!res.ok) return false;
      const body = (await res.json()) as { access_token: string; refresh_token: string };
      setSession({
        accessToken: body.access_token,
        refreshToken: body.refresh_token ?? current.refreshToken,
        email: current.email,
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;

  try {
    res = await rawRequest(path, options);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'Could not reach the Ivy Homes API. Check your connection and try again.');
  }

  if (res.status === 401 && !options.anonymous) {
    const refreshed = await refreshSession();
    if (refreshed) {
      try {
        res = await rawRequest(path, options);
      } catch {
        throw new ApiError(0, 'Could not reach the Ivy Homes API. Check your connection and try again.');
      }
    }
    if (res.status === 401) {
      notifyExpired();
      const body = await res.json().catch(() => null);
      throw new ApiError(401, messageFromBody(401, body), body);
    }
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) throw new ApiError(res.status, messageFromBody(res.status, body), body);

  return body as T;
}

export const apiConfigured = Boolean(API_KEY);
