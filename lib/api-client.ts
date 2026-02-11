/**
 * Lightweight fetch wrapper for API calls.
 * Throws on non-2xx responses with parsed error messages.
 */
import { getCsrfToken } from "next-auth/react";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response body not JSON
    }
    throw new ApiError(message, res.status);
  }
  return res.json();
}

async function getHeaders(includeContentHeader = true) {
  const csrfToken = await getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  if (includeContentHeader) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export const api = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    return handleResponse<T>(res);
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: await getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async put<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "PUT",
      headers: await getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async patch<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "PATCH",
      headers: await getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: "DELETE",
      headers: await getHeaders(false),
    });
    return handleResponse<T>(res);
  },
};
