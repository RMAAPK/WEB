const configuredBackend = import.meta.env.VITE_API_BASE_URL || 'https://s.rmaa.pk';

export const BACKEND_BASE_URL = configuredBackend.replace(/\/+$/, '');
export const API_BASE_URL = `${BACKEND_BASE_URL}/api`;

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return fetch(`${API_BASE_URL}${normalizedPath}`, init);
}
