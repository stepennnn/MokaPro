const CSRF_COOKIE_PATH = '/sanctum/csrf-cookie';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.errors = payload?.errors && typeof payload.errors === 'object' ? payload.errors : null;
  }

  getFirstFieldError() {
    if (!this.errors) {
      return null;
    }

    for (const messages of Object.values(this.errors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        return String(messages[0]);
      }
      if (typeof messages === 'string' && messages.trim() !== '') {
        return messages;
      }
    }

    return null;
  }
}

function resolveUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function getCredentialsMode(url) {
  if (!API_BASE_URL) {
    return 'same-origin';
  }

  if (typeof window !== 'undefined') {
    try {
      const targetOrigin = new URL(url, window.location.origin).origin;
      return targetOrigin !== window.location.origin ? 'include' : 'same-origin';
    } catch {
      return 'include';
    }
  }

  return 'include';
}

function getCookie(name) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function extractErrorMessage(payload, response) {
  if (payload?.errors && typeof payload.errors === 'object') {
    for (const messages of Object.values(payload.errors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        return String(messages[0]);
      }
    }
  }

  return payload?.message || response.statusText || `Request failed (${response.status})`;
}

async function errorFromResponse(response) {
  let payload = null;

  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  return new ApiError(
    extractErrorMessage(payload, response),
    response.status,
    payload,
  );
}

async function ensureCsrfToken(headers) {
  const csrfUrl = resolveUrl(CSRF_COOKIE_PATH);
  const csrfResponse = await fetch(csrfUrl, {
    credentials: getCredentialsMode(csrfUrl),
    headers: { Accept: 'application/json' },
  });

  if (!csrfResponse.ok) {
    throw await errorFromResponse(csrfResponse);
  }

  const csrfToken = getCookie('XSRF-TOKEN');

  if (!csrfToken) {
    throw new ApiError('The CSRF cookie was not set by the server.', csrfResponse.status);
  }

  headers.set('X-XSRF-TOKEN', csrfToken);
}

export async function apiFetch(path, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  const url = resolveUrl(path);
  const credentials = getCredentialsMode(url);
  const isAuthBootstrapPath = path === '/api/session' || path === '/api/login';

  headers.set('Accept', 'application/json');

  if (!SAFE_METHODS.has(method) && path !== CSRF_COOKIE_PATH) {
    await ensureCsrfToken(headers);
  }

  if (
    init.body
    && !headers.has('Content-Type')
    && !(typeof FormData !== 'undefined' && init.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(url, {
    ...init,
    credentials,
    headers,
  });

  // Retry once on HTTP 419 (CSRF token mismatch) after refreshing the CSRF cookie
  if (response.status === 419 && !SAFE_METHODS.has(method) && path !== CSRF_COOKIE_PATH) {
    await ensureCsrfToken(headers);
    response = await fetch(url, {
      ...init,
      credentials,
      headers,
    });
  }

  if (!response.ok) {
    const error = await errorFromResponse(response);

    if (error.status === 401 && !isAuthBootstrapPath && unauthorizedHandler) {
      unauthorizedHandler(error);
    }

    throw error;
  }

  return response;
}
