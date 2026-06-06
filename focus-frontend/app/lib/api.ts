// lib/api.ts

const BASE = "http://localhost:8080/api";

/**
 * Thin fetch wrapper that attaches the Bearer token automatically.
 * Throws on non-2xx responses so callers can catch cleanly.
 *
 * Usage:
 *   const data = await api.get("/focus/history", token);
 *   const session = await api.post("/focus/start", token);
 *   const updated = await api.put("/focus/stop/5", token);
 *   await api.del("/focus/3/note", token);
 */

function authHeaders(token: string, json = false): HeadersInit {
  const h: HeadersInit = { Authorization: `Bearer ${token}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function request<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(token, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }

  // 204 No Content — return empty object
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:  <T>(path: string, token: string)                  => request<T>("GET",    path, token),
  post: <T>(path: string, token: string, body?: unknown)  => request<T>("POST",   path, token, body),
  put:  <T>(path: string, token: string, body?: unknown)  => request<T>("PUT",    path, token, body),
  del:  <T>(path: string, token: string)                  => request<T>("DELETE", path, token),
};