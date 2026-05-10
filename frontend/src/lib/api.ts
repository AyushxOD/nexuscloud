import type { CloudOptimizerResponse, APIError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://g3xewrthlc.execute-api.us-east-1.amazonaws.com';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async fetchWithTimeout(
    url: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const { timeout = this.timeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    console.log(`[API] GET ${endpoint}`);

    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const responseText = await response.text();

    console.log(`[API] Response ${response.status}:`, responseText.substring(0, 500));

    if (!response.ok) {
      const error: APIError = {
        error: `HTTP ${response.status}`,
        message: responseText,
        code: response.status.toString(),
      };
      throw new Error(JSON.stringify(error));
    }

    try {
      const data = JSON.parse(responseText) as T;
      return data;
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }
  }

  async post<T>(endpoint: string, body?: unknown, options?: FetchOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    console.log(`[API] POST ${endpoint}`, body);

    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const responseText = await response.text();
    return JSON.parse(responseText) as T;
  }
}

// Singleton instance
const apiClient = new APIClient(API_BASE_URL, 30000);

// Optimizer API functions
export async function fetchOptimizationData(): Promise<CloudOptimizerResponse> {
  return apiClient.get<CloudOptimizerResponse>('/optimizer?action=analyze');
}

export async function fetchSpending(): Promise<CloudOptimizerResponse> {
  return apiClient.get<CloudOptimizerResponse>('/optimizer?action=get-spending');
}

export async function fetchRecommendations(): Promise<CloudOptimizerResponse> {
  return apiClient.get<CloudOptimizerResponse>('/optimizer?action=get-recommendations');
}

// Resource API functions
export async function fetchResourceMetadata() {
  return apiClient.get('/resources');
}

export async function fetchResourceById(id: string) {
  return apiClient.get(`/resources/${id}`);
}

export async function createResource(data: Record<string, unknown>) {
  return apiClient.post('/resources', data);
}

export async function updateResource(id: string, data: Record<string, unknown>) {
  return apiClient.post(`/resources/${id}`, data);
}

export async function deleteResource(id: string) {
  const response = await fetch(`${API_BASE_URL}/resources/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.json();
}

// Utility function for API health check
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Export API client for custom requests
export { apiClient as defaultAPIClient };

// Type exports
export type { APIError, FetchOptions };