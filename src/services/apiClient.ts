import { API_BASE_URL } from '../config/env';

interface FetchOptions extends RequestInit {
  data?: any;
}

export const apiClient = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.data) {
    config.body = JSON.stringify(options.data);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  let responseData;
  try {
    responseData = await response.json();
  } catch (error) {
    responseData = null;
  }

  if (!response.ok) {
    // Toda la API exige JWT salvo /auth/login. Un 401 acá significa que no hay
    // token o que expiró — se limpia la sesión y se manda a login, salvo que
    // el 401 venga del login mismo (credenciales inválidas, no un tema de sesión).
    const isLoginRequest = endpoint.includes('/auth/login');
    if (response.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }

    // throw standard error combining ProblemDetails standard from .NET
    throw {
      status: response.status,
      message: responseData?.title || responseData?.detail || 'An error occurred while processing your request.',
      errors: responseData?.errors || {},
    };
  }

  return responseData as T;
};
