import { z } from "zod";

// =============================================================================
// REST API Client Configuration
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

function getHeaders(customHeaders?: Record<string, string>): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...customHeaders,
  };

  // Add auth token if available
  const token = localStorage.getItem("auth_token");
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// =============================================================================
// API Client Methods
// =============================================================================

export const apiClient = {
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(options?.headers),
    });
    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "PUT",
      headers: getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(options?.headers),
    });
    return handleResponse<T>(response);
  },
};

// =============================================================================
// API Response Schemas (for validation)
// =============================================================================

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  });

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
