const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  if (!path.startsWith('/api')) {
    return path;
  }

  return API_URL ? `${API_URL}${path}` : path;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
