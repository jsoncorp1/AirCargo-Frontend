import { API_BASE_URL } from '../config/env';
import {
  API_ERROR_MESSAGES,
  FORBIDDEN_FALLBACK_MESSAGE,
  ORPHAN_TOKEN_ERROR_KEYS,
} from './apiErrorMessages';

/** Cuerpo de error de .NET: ProblemDetails. */
interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

interface FetchOptions extends RequestInit {
  data?: any;
}

const authToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

/**
 * Traduce una respuesta con error y siempre lanza.
 *
 * Vive aparte de `apiClient` porque las descargas de archivos (`apiDownload`)
 * fallan igual que cualquier otra llamada —401, 403, ProblemDetails— y no tiene
 * sentido tener dos lugares donde se decide cuándo cerrar la sesión.
 */
const throwApiError = async (
  endpoint: string,
  response: Response,
  responseData: ProblemDetails | null
): Promise<never> => {
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

  // Los errores llegan como ProblemDetails con `title` = clave estable y
  // `detail` = mensaje en castellano YA REDACTADO para mostrar. El 403 del
  // middleware de roles llega sin body.
  //
  // El orden importa: primero el mensaje propio de la clave (más contexto de
  // pantalla que el genérico del backend), después el `detail`, y la clave
  // cruda solo como último recurso. Al revés, una clave que este build todavía
  // no conoce le mostraba al usuario "pricing.rate.notfound" en vez de la
  // explicación en castellano que el backend ya había mandado.
  const mappedMessage =
    (errorKey && API_ERROR_MESSAGES[errorKey]) ||
    responseData?.detail ||
    errorKey;
  const fallbackMessage =
    response.status === 403
      ? FORBIDDEN_FALLBACK_MESSAGE
      : 'An error occurred while processing your request.';

  // El 429 del formulario público manda `Retry-After` en segundos; se sube al
  // error para poder decirle al visitante cuánto esperar, en vez de un
  // "intenta más tarde" sin número.
  const retryAfterRaw = response.headers.get('Retry-After');
  const retryAfterSeconds =
    retryAfterRaw && /^\d+$/.test(retryAfterRaw.trim())
      ? Number(retryAfterRaw.trim())
      : undefined;

  // throw standard error combining ProblemDetails standard from .NET
  throw {
    status: response.status,
    // `title` (error key) primero para que los mapas de mensajes por módulo
    // (p. ej. SHIPMENT_ERROR_MESSAGES) puedan seguir traduciendo por clave.
    message: mappedMessage || fallbackMessage,
    errorKey,
    detail: responseData?.detail,
    errors: responseData?.errors || {},
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  };
};

export const apiClient = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const token = authToken();

  // Con `FormData` el Content-Type lo tiene que armar el navegador: lleva el
  // boundary del multipart, que nosotros no conocemos. Si lo escribimos a mano
  // la petición llega rota y el backend no encuentra ningún archivo.
  const isFormData = typeof FormData !== 'undefined' && options.data instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.data) {
    config.body = isFormData ? (options.data as FormData) : JSON.stringify(options.data);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  let responseData: ProblemDetails | null;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    await throwApiError(endpoint, response, responseData);
  }

  return responseData as T;
};

/**
 * Igual que `apiClient`, pero para endpoints que devuelven un archivo.
 *
 * No se puede usar `apiClient` acá: parsea la respuesta como JSON y un .xlsx
 * la haría fallar. El nombre sale del `Content-Disposition` que manda el
 * backend, para que el archivo se llame igual que si lo hubiera bajado del
 * navegador (`envios-2026-09.xlsx`).
 */
export const apiDownload = async (
  endpoint: string,
  fallbackFilename: string
): Promise<{ blob: Blob; filename: string }> => {
  const token = authToken();
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    // El error sí viene en JSON aunque el camino feliz sea binario.
    let responseData: ProblemDetails | null = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
    await throwApiError(endpoint, response, responseData);
  }

  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(response.headers.get('Content-Disposition'), fallbackFilename),
  };
};

const filenameFromDisposition = (header: string | null, fallback: string): string => {
  if (!header) return fallback;
  // `filename*=UTF-8''...` gana sobre `filename="..."` cuando los dos vienen:
  // es el que sobrevive a los acentos.
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      /* cae al `filename` plano */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : fallback;
};

/** Dispara la descarga en el navegador y limpia la URL temporal. */
export const saveBlob = (blob: Blob, filename: string): void => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
};
