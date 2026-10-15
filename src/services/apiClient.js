/**
 * AMOGA E-COMMERCE — API CLIENT
 * Centralized, resilient HTTP client for interacting with the backend API.
 */

const API_BASE_URL = '/api';

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeout || 30000;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      cache: options.cache || 'no-store',
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(id);

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && data !== null && (data.error || data.message)) ||
        `Request failed with status ${response.status}`;
      const details = typeof data === 'object' && data !== null ? data.details || data.errors : null;
      throw new ApiError(errorMessage, response.status, details);
    }

    return data;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your network connection.', 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error occurred while contacting the server.', 500);
  }
}
