import { apiClient } from './apiClient';
import { getApiErrorMessage, isApiError } from './apiErrorMessages';
import type { BadgeColor, ShipmentObservation, ShipmentStatus } from './shipmentService';
import type { PickupOrderStatus } from './pickupOrderService';
import type { PaymentType } from './logisticsEnums';

// Tarea del conductor. Reemplaza al módulo `shipment-assignments`, que se
// renombró entero: la misma entidad ahora cubre las DOS puntas de la calle.
//
//   kind = 'Delivery' → llevarle el paquete al cliente (el viejo reparto).
//   kind = 'Pickup'   → ir a buscarlo al domicilio de una solicitud de recojo.
//
// Una sola pantalla de listado y una de detalle sirven para las dos: los datos
// de contacto y dirección vienen UNIFICADOS (`contactName`, `contactPhone`,
// `address`, `locationUrl`) sin que el front tenga que saber si por detrás
// salen de un envío o de una solicitud.

export type DriverTaskKind = 'Pickup' | 'Delivery';

export const DRIVER_TASK_KIND_LABELS: Record<DriverTaskKind, string> = {
  Pickup: 'Recojo',
  Delivery: 'Entrega',
};

export const driverTaskKindLabel = (kind: DriverTaskKind | string): string =>
  DRIVER_TASK_KIND_LABELS[kind as DriverTaskKind] ?? kind;

export const driverTaskKindBadge = (kind: DriverTaskKind | string): BadgeColor =>
  kind === 'Pickup' ? 'warning' : 'primary';

// ─── Estados ─────────────────────────────────────────────────────────────────

//   Assigned ──→ EnRoute ──→ Completed
//       │             └────→ Failed
//       └──→ Cancelled   (lo manda el admin al desasignar, no el conductor)
export type DriverTaskStatus =
  | 'Assigned'
  | 'EnRoute'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export const DRIVER_TASK_STATUS_LABELS: Record<DriverTaskStatus, string> = {
  Assigned: 'Asignada',
  EnRoute: 'En camino',
  Completed: 'Completada',
  Failed: 'No completada',
  Cancelled: 'Anulada',
};

export const DRIVER_TASK_STATUS_BADGE: Record<DriverTaskStatus, BadgeColor> = {
  Assigned: 'primary',
  EnRoute: 'info',
  Completed: 'success',
  Failed: 'error',
  Cancelled: 'dark',
};

export const driverTaskStatusLabel = (status: DriverTaskStatus | string): string =>
  DRIVER_TASK_STATUS_LABELS[status as DriverTaskStatus] ?? status;

export const driverTaskStatusBadge = (status: DriverTaskStatus | string): BadgeColor =>
  DRIVER_TASK_STATUS_BADGE[status as DriverTaskStatus] ?? 'light';

/** Tareas todavía en curso. `onlyOpen=true` en el listado filtra por estas. */
export const OPEN_DRIVER_TASK_STATUSES: DriverTaskStatus[] = ['Assigned', 'EnRoute'];

export const isDriverTaskOpen = (status: DriverTaskStatus | string): boolean =>
  OPEN_DRIVER_TASK_STATUSES.includes(status as DriverTaskStatus);

// Lo que puede hacer el CONDUCTOR dueño de la tarea, por estado actual.
// `Cancelled` no está acá: lo manda el admin para desasignar.
export const DRIVER_TASK_TRANSITIONS: Record<DriverTaskStatus, DriverTaskStatus[]> = {
  Assigned: ['EnRoute'],
  EnRoute: ['Completed', 'Failed'],
  Completed: [],
  Failed: [],
  Cancelled: [],
};

// Lo que ve el conductor como botón. Cambia según de qué punta de la calle se
// trate: "salgo a buscarlo" y "salgo a entregarlo" no son la misma frase.
export const DRIVER_TASK_ACTION_LABELS: Record<
  DriverTaskKind,
  Partial<Record<DriverTaskStatus, string>>
> = {
  Pickup: {
    EnRoute: 'Salí a buscarlo',
    Completed: 'Recogí el paquete',
    Failed: 'No pude recogerlo',
  },
  Delivery: {
    EnRoute: 'Recogí el paquete',
    Completed: 'Entregué',
    Failed: 'No pude entregar',
  },
};

export const driverTaskActionLabel = (
  kind: DriverTaskKind | string,
  status: DriverTaskStatus
): string =>
  DRIVER_TASK_ACTION_LABELS[kind as DriverTaskKind]?.[status] ??
  driverTaskStatusLabel(status);

// ─── Qué le pasa al objetivo ─────────────────────────────────────────────────
//
// El mismo endpoint mueve el envío o la solicitud según el `kind`, y el front no
// tiene que hacer nada al respecto salvo refrescar. Estos mapas son solo para
// poder ANTICIPARLO en pantalla ("el envío va a quedar en …").

export const DELIVERY_CASCADE: Record<DriverTaskStatus, ShipmentStatus | null> = {
  Assigned: 'Assigned',
  EnRoute: 'OutForDelivery',
  Completed: 'Delivered',
  // Depende de la observación: `CustomerRefused` deja el envío en `Rejected`.
  Failed: 'Observed',
  Cancelled: 'AtDestinationBranch',
};

export const PICKUP_CASCADE: Record<DriverTaskStatus, PickupOrderStatus | null> = {
  Assigned: 'Assigned',
  EnRoute: 'InTransit',
  Completed: 'Collected',
  // Vuelve a `Confirmed`, lista para reasignar a otro conductor.
  Failed: 'Confirmed',
  Cancelled: 'Confirmed',
};

export const shipmentStatusAfterFailure = (
  observation: ShipmentObservation | '' | null | undefined
): ShipmentStatus => (observation === 'CustomerRefused' ? 'Rejected' : 'Observed');

// `Failed` exige observación (`assignment.observation.required`).
export const driverTaskRequiresObservation = (status: DriverTaskStatus): boolean =>
  status === 'Failed';

/**
 * Cerrar una tarea pide foto.
 *
 * En un reparto es una regla del backend (`assignment.photos.required`). En un
 * recojo la foto es la constancia de QUÉ se recibió y en qué estado, así que la
 * app la pide igual: sin ella, una discusión posterior sobre el contenido del
 * bulto no tiene con qué resolverse.
 */
export const driverTaskRequiresPhotos = (status: DriverTaskStatus): boolean =>
  status === 'Completed';

export function getDriverTaskErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

/**
 * Mensaje de un error de subida de fotos. Se prefiere el `detail` del backend
 * porque trae el dato concreto —qué archivo rebotó, cuántas fotos ya hay— que
 * el mensaje genérico por clave no puede tener.
 */
export function getPhotoErrorMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.detail?.trim() && isPhotoErrorKey(err.errorKey)) {
    return err.detail;
  }
  return getDriverTaskErrorMessage(err, fallback);
}

// Las claves de foto siguen bajo el prefijo `assignment.` aunque el módulo se
// haya renombrado: es lo que manda el backend.
const isPhotoErrorKey = (key?: string): boolean =>
  !!key && (key.startsWith('assignment.photos.') || key === 'image.upload.failed');

/**
 * `true` cuando el rechazo depende de cuántas fotos hay guardadas o de si la
 * tarea sigue abierta: lo que la pantalla tiene en memoria quedó viejo y hay que
 * volver a leer la tarea antes de reintentar.
 */
export function isStalePhotoState(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return (
    err.errorKey === 'assignment.photos.toomany' ||
    err.errorKey === 'assignment.photos.closed'
  );
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface DriverTask {
  id: string;
  kind: DriverTaskKind;

  // Bloque de reparto: poblado cuando `kind === 'Delivery'`.
  shipmentId?: string | null;
  shipmentCode?: string | null;
  waybillNumber?: string | null;
  shipmentStatus?: ShipmentStatus | null;

  // Bloque de recojo: poblado cuando `kind === 'Pickup'`. La ventana horaria
  // solo se muestra acá — una entrega no tiene hora comprometida.
  pickupOrderId?: string | null;
  pickupOrderCode?: string | null;
  pickupOrderStatus?: PickupOrderStatus | null;
  pickupDate?: string | null;
  pickupWindowStart?: string | null;
  pickupWindowEnd?: string | null;

  // Unificado: sale del envío o de la solicitud según el `kind`, ya resuelto
  // por el backend.
  contactName: string;
  contactPhone?: string | null;
  contactPhoneAlt?: string | null;
  address: string;
  locationUrl?: string | null;
  addressReference?: string | null;
  destinationDepartment?: string | null;

  paymentType?: PaymentType | null;
  /** Lo que el conductor tiene que cobrar en la puerta. `0` si no es contra entrega. */
  amountToCollect: number;
  totalWeight?: number | null;
  packageCount?: number | null;

  status: DriverTaskStatus;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  observation?: ShipmentObservation | null;
  /** Cuántas fotos tiene guardadas, sin traerse las URLs de cada tarea. */
  photoCount?: number | null;
  /** Lo que le queda al conductor por esta tarea, ya calculado por el backend. */
  commissionAmount?: number | null;

  driverUserId: string;
  driverFullName: string;
}

// GET /driver-tasks/{id}: lo mismo más la evidencia y el detalle de la carga.
export interface DriverTaskDetail extends DriverTask {
  photoUrls?: string[] | null;
  comment?: string | null;
  packageDescription?: string | null;
  driverPhoneNumber?: string | null;
}

export interface DriverTasksPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: DriverTask[];
}

export interface DriverTaskListFilters {
  // El conductor ve solo lo suyo; para él este filtro se ignora server-side.
  driverUserId?: string;
  shipmentId?: string;
  status?: DriverTaskStatus | '';
  /** `true` → solo `Assigned` y `EnRoute`: "lo que me queda por hacer". */
  onlyOpen?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Asignación de REPARTOS por lote: es la vuelta que sale junta.
 *
 * Todo-o-nada: si un envío del lote no se puede asignar, no se asigna ninguno.
 *
 * El recojo NO se asigna por acá: va de a uno por
 * `pickupOrderService.assignDriver`, porque es una ventana horaria en un
 * domicilio concreto.
 */
export interface CreateDriverTasksRequest {
  driverUserId: string;
  shipmentIds: string[];
}

export interface CreatedDriverTask {
  taskId: string;
  shipmentId: string;
  shipmentCode: string;
  taskStatus: DriverTaskStatus;
  shipmentStatus: ShipmentStatus;
  assignedAt: string;
  contactName?: string | null;
  address?: string | null;
}

export interface CreateDriverTasksResponse {
  driverUserId: string;
  driverFullName: string;
  assignedCount: number;
  tasks: CreatedDriverTask[];
}

// Sin `photoUrls`: las fotos ya viajaron por `uploadPhotos` y el backend cuenta
// las que tiene guardadas. El campo sigue aceptándose en la API, pero admitiría
// una URL arbitraria de cualquier cliente, así que desde acá no se manda.
export interface ChangeDriverTaskStatusRequest {
  status: DriverTaskStatus;
  /** Obligatoria si `Failed`. */
  observation?: ShipmentObservation;
  comment?: string;
}

// ─── Fotos ───────────────────────────────────────────────────────────────────
//
// Los archivos van al backend y él los sube al servicio de imágenes. La app no
// toca Cloudinary ni necesita credenciales suyas.
//
// Son dos llamadas separadas (subir fotos, después cambiar el estado) a
// propósito: subir por red móvil es lo que más falla, y si la subida viviera
// dentro del cambio de estado, un reintento arrastraría también la transición
// del envío o de la solicitud.

/** Tope por tarea, acumulado entre llamadas. El mínimo para cerrarla es 1. */
export const MAX_TASK_PHOTOS = 3;

/** 10 MB por archivo, igual que el backend. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Para el `accept` del input: mismos tipos que acepta el backend. */
export const ACCEPTED_PHOTO_TYPES = ACCEPTED_PHOTO_MIME_TYPES.join(',');

export interface UploadTaskPhotosResponse {
  taskId: string;
  /** TODAS las fotos de la tarea, no solo las recién subidas. */
  photoUrls: string[];
  /** Cuántas más admite. Sirve para el contador "2 de 3". */
  remainingSlots: number;
}

/**
 * Las mismas validaciones que hace el backend, para no gastar un viaje —y una
 * subida por red móvil— en un archivo que va a rebotar. Devuelve el motivo o
 * `null` si el archivo sirve.
 */
export function getPhotoFileError(file: File): string | null {
  if (!ACCEPTED_PHOTO_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" no es JPG, PNG ni WEBP.`;
  }
  if (file.size === 0) {
    return `"${file.name}" está vacío. Vuelve a sacar la foto.`;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return `"${file.name}" pesa más de ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const driverTaskService = {
  getTasks: async (
    page = 1,
    perPage = 10,
    filters: DriverTaskListFilters = {}
  ): Promise<DriverTasksPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
    if (filters.driverUserId) query.append('driverUserId', filters.driverUserId);
    if (filters.shipmentId) query.append('shipmentId', filters.shipmentId);
    if (filters.status) query.append('status', filters.status);
    if (filters.onlyOpen) query.append('onlyOpen', 'true');
    if (filters.dateFrom) query.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.append('dateTo', filters.dateTo);
    return apiClient<DriverTasksPaginatedResponse>(`/driver-tasks?${query.toString()}`);
  },

  getTaskById: async (id: string): Promise<DriverTaskDetail> => {
    return apiClient<DriverTaskDetail>(`/driver-tasks/${id}`);
  },

  /**
   * Roles: superadmin, admin. SOLO repartos.
   *
   * El backend exige que el conductor tenga perfil
   * (`drivertask.driver.noprofile`) y que un esporádico esté en línea
   * (`drivertask.driver.offline`), así que el selector tiene que alimentarse de
   * `driverService.getAvailableDrivers()`.
   */
  createTasks: async (
    data: CreateDriverTasksRequest
  ): Promise<CreateDriverTasksResponse> => {
    return apiClient<CreateDriverTasksResponse>('/driver-tasks', {
      method: 'POST',
      data,
    });
  },

  /**
   * Sube de 1 a 3 fotos. Solo el conductor dueño de la tarea y solo mientras
   * siga abierta (`Assigned` o `EnRoute`).
   *
   * El tope de 3 es acumulado: si ya hay 2 guardadas, esta llamada admite 1.
   * La respuesta trae la lista completa, así que el estado local se reemplaza
   * con ella en vez de ir acumulando a mano.
   */
  uploadPhotos: async (id: string, files: File[]): Promise<UploadTaskPhotosResponse> => {
    const form = new FormData();
    // Mismo nombre de campo repetido, uno por archivo: así lo espera el backend.
    for (const file of files) form.append('photos', file);
    return apiClient<UploadTaskPhotosResponse>(`/driver-tasks/${id}/photos`, {
      method: 'POST',
      data: form,
    });
  },

  /**
   * Parte del conductor. Roles: superadmin, admin, conductor.
   *
   * Mueve la tarea Y su objetivo juntos: el envío si es un reparto, la solicitud
   * de recojo si es un recojo. El front no elige cuál — refresca y listo.
   */
  changeStatus: async (
    id: string,
    data: ChangeDriverTaskStatusRequest
  ): Promise<DriverTaskDetail> => {
    return apiClient<DriverTaskDetail>(`/driver-tasks/${id}/status`, {
      method: 'PATCH',
      data,
    });
  },
};
