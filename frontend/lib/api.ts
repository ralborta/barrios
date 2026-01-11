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
    const headers: Record<string, string> = {};

    // Solo establecer Content-Type si no es FormData y no se proporcionó en options.headers
    const isFormData = options.body instanceof FormData;
    if (!isFormData && !options.headers) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Merge with existing headers if provided
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers as Record<string, string>);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Leer el texto primero para poder manejar respuestas vacías o no-JSON
      const text = await response.text();
      
      // Si la respuesta está vacía, devolver error
      if (!text) {
        return {
          success: false,
          error: `Error ${response.status}: ${response.statusText || 'Sin respuesta'}`,
        };
      }

      // Intentar parsear como JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // Si no es JSON, devolver el texto como error
        return {
          success: false,
          error: `Error ${response.status}: ${text || response.statusText || 'Respuesta inválida'}`,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
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
    const isFormData = data instanceof FormData;
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
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
  // Boletas
  uploadBoleta: (expensaId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/expensas/${expensaId}/boleta`, formData);
  },
  downloadBoleta: (expensaId: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return fetch(`${API_URL}/api/expensas/${expensaId}/boleta`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
  deleteBoleta: (expensaId: string) => api.delete(`/api/expensas/${expensaId}/boleta`),
};

// Comprobantes endpoints
export const comprobantesApi = {
  list: (params?: { vecinoId?: string; expensaId?: string; estado?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/api/comprobantes${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get(`/api/comprobantes/${id}`),
  create: (data: FormData) => api.post('/api/comprobantes', data),
  update: (id: string, data: any) => api.put(`/api/comprobantes/${id}`, data),
  delete: (id: string) => api.delete(`/api/comprobantes/${id}`),
};

// Mensajes endpoints
export const mensajesApi = {
  list: (params?: { vecinoId?: string; expensaId?: string; canal?: string; tipo?: string; estado?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/api/mensajes${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get(`/api/mensajes/${id}`),
  create: (data: any) => api.post('/api/mensajes', data),
  update: (id: string, data: any) => api.put(`/api/mensajes/${id}`, data),
  delete: (id: string) => api.delete(`/api/mensajes/${id}`),
  getByExpensa: (expensaId: string) => api.get(`/api/mensajes/expensa/${expensaId}`),
  sendBatch: (data: { vecinoIds: string[]; canal: 'WHATSAPP' | 'EMAIL'; tipo: string; contenido?: string; asunto?: string; templateId?: string; expensaIds?: Record<string, string> }) => {
    return api.post('/api/mensajes/batch', data);
  },
};

export const templatesApi = {
  list: (params?: { tipo?: string; canal?: string; activo?: boolean }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/api/templates${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get(`/api/templates/${id}`),
  create: (data: any) => api.post('/api/templates', data),
  update: (id: string, data: any) => api.put(`/api/templates/${id}`, data),
  delete: (id: string) => api.delete(`/api/templates/${id}`),
};

// Import endpoints
export const pagosApi = {
  list: (params?: { estado?: string; vecinoId?: string; expensaId?: string; fechaDesde?: string; fechaHasta?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<any[]>(`/api/pagos${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get(`/api/pagos/${id}`),
  revisar: (id: string, data: { accion: 'conciliar' | 'rechazar' | 'marcar_duplicado'; expensaId?: string; observaciones?: string }) => {
    return api.put(`/api/pagos/${id}/revisar`, data);
  },
};

export const importApi = {
  importVecinos: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/import/vecinos', formData);
  },
  downloadTemplate: () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return fetch(`${API_URL}/api/import/vecinos/template`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
  importComprobantes: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/import/comprobantes', formData);
  },
  downloadComprobantesTemplate: () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return fetch(`${API_URL}/api/import/comprobantes/template`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
  importBoletas: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/import/boletas', formData);
  },
  downloadBoletasTemplate: () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return fetch(`${API_URL}/api/import/boletas/template`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};
