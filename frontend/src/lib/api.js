const CSRF_COOKIE_PATH = '/sanctum/csrf-cookie';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
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
    payload?.message || response.statusText || `Request failed (${response.status})`,
    response.status,
    payload,
  );
}

export async function apiFetch(path, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  if (
    !SAFE_METHODS.has(method)
    && path !== CSRF_COOKIE_PATH
  ) {
    const csrfResponse = await fetch(CSRF_COOKIE_PATH, {
      credentials: 'same-origin',
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

  if (
    init.body
    && !headers.has('Content-Type')
    && !(typeof FormData !== 'undefined' && init.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers,
  });

  if (!response.ok) {
    throw await errorFromResponse(response);
  }

  return response;
}
