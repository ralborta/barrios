const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'Error desconocido',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any }>('/api/auth/login', { email, password }),
  
  register: (email: string, password: string, nombre: string, rol?: string) =>
    api.post<{ token: string; user: any }>('/api/auth/register', { email, password, nombre, rol }),
  
  me: () => api.get<{ user: any }>('/api/auth/me'),
};

// Vecinos endpoints
export const vecinosApi = {
  list: (params?: { countryId?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/api/vecinos${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get(`/api/vecinos/${id}`),
  create: (data: any) => api.post('/api/vecinos', data),
  update: (id: string, data: any) => api.put(`/api/vecinos/${id}`, data),
  delete: (id: string) => api.delete(`/api/vecinos/${id}`),
};

// Countries endpoints
export const countriesApi = {
  list: () => api.get('/api/countries'),
  get: (id: string) => api.get(`/api/countries/${id}`),
  create: (data: any) => api.post('/api/countries', data),
  update: (id: string, data: any) => api.put(`/api/countries/${id}`, data),
  delete: (id: string) => api.delete(`/api/countries/${id}`),
};

// Períodos endpoints
export const periodosApi = {
  list: (params?: { countryId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/api/periodos${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get(`/api/periodos/${id}`),
  create: (data: any) => api.post('/api/periodos', data),
  update: (id: string, data: any) => api.put(`/api/periodos/${id}`, data),
  delete: (id: string) => api.delete(`/api/periodos/${id}`),
};

// Expensas endpoints
export const expensasApi = {
  list: (params?: { periodoId?: string; vecinoId?: string; estado?: string; countryId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/api/expensas${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get(`/api/expensas/${id}`),
  create: (data: any) => api.post('/api/expensas', data),
  update: (id: string, data: any) => api.put(`/api/expensas/${id}`, data),
  delete: (id: string) => api.delete(`/api/expensas/${id}`),
  bulkCreate: (data: any) => api.post('/api/expensas/bulk', data),
};
