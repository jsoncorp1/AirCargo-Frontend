import { API_BASE_URL } from '../config/env';
import {
  API_ERROR_MESSAGES,
  FORBIDDEN_FALLBACK_MESSAGE,
  ORPHAN_TOKEN_ERROR_KEYS,
} from './apiErrorMessages';

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
    const errorKey: string | undefined = responseData?.title;

    // Toda la API exige JWT salvo /auth/login. Un 401 acá significa que no hay
    // token o que expiró — se limpia la sesión y se manda a login, salvo que
    // el 401 venga del login mismo (credenciales inválidas, no un tema de sesión).
    // Los 404 `*.user.notfound` son tokens huérfanos (el usuario del token ya no
    // existe en BD, p. ej. tras un reseteo): se tratan igual que un 401.
    const isLoginRequest = endpoint.includes('/auth/login');
    const isOrphanToken = !!errorKey && ORPHAN_TOKEN_ERROR_KEYS.has(errorKey);
    if ((response.status === 401 || isOrphanToken) && !isLoginRequest && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }

    // Los errores de permisos llegan como ProblemDetails con `title` = error key
    // y `detail` en español. El 403 del middleware de roles llega sin body.
    const mappedMessage =
      (errorKey && API_ERROR_MESSAGES[errorKey]) ||
      errorKey ||
      responseData?.detail;
    const fallbackMessage =
      response.status === 403
        ? FORBIDDEN_FALLBACK_MESSAGE
        : 'An error occurred while processing your request.';

    // throw standard error combining ProblemDetails standard from .NET
    throw {
      status: response.status,
      // `title` (error key) primero para que los mapas de mensajes por módulo
      // (p. ej. SHIPMENT_ERROR_MESSAGES) puedan seguir traduciendo por clave.
      message: mappedMessage || fallbackMessage,
      errorKey,
      detail: responseData?.detail,
      errors: responseData?.errors || {},
    };
  }

  return responseData as T;
};
