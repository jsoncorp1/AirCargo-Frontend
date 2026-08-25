import { apiClient } from './apiClient';
import { getApiErrorMessage, isApiError } from './apiErrorMessages';
import type { BadgeColor, ShipmentObservation, ShipmentStatus } from './shipmentService';

// Una asignación es un INTENTO de reparto: el admin de la sucursal destino le
// entrega un envío a un conductor y este lo lleva al cliente.
//
// Si un intento falla se crea una asignación nueva y la anterior queda como
// historial. Un envío tiene a lo sumo un intento vigente a la vez.

// ─── Estados ─────────────────────────────────────────────────────────────────

//   Assigned ──→ PickedUp ──→ Delivered
//       │                └──→ Failed
//       └──→ Cancelled
export type ShipmentAssignmentStatus =
  | 'Assigned'
  | 'PickedUp'
  | 'Delivered'
  | 'Failed'
  | 'Cancelled';

export const ASSIGNMENT_STATUS_LABELS: Record<ShipmentAssignmentStatus, string> = {
  Assigned: 'Asignado',
  PickedUp: 'Recogido',
  Delivered: 'Entregado',
  Failed: 'No entregado',
  Cancelled: 'Anulado',
};

export const ASSIGNMENT_STATUS_BADGE: Record<ShipmentAssignmentStatus, BadgeColor> = {
  Assigned: 'primary',
  PickedUp: 'info',
  Delivered: 'success',
  Failed: 'error',
  Cancelled: 'dark',
};

export const assignmentStatusLabel = (status: ShipmentAssignmentStatus | string): string =>
  ASSIGNMENT_STATUS_LABELS[status as ShipmentAssignmentStatus] ?? status;

export const assignmentStatusBadge = (status: ShipmentAssignmentStatus | string): BadgeColor =>
  ASSIGNMENT_STATUS_BADGE[status as ShipmentAssignmentStatus] ?? 'light';

// Intentos todavía en curso. `onlyOpen=true` en el listado filtra por estos.
export const OPEN_ASSIGNMENT_STATUSES: ShipmentAssignmentStatus[] = ['Assigned', 'PickedUp'];

export const isAssignmentOpen = (status: ShipmentAssignmentStatus | string): boolean =>
  OPEN_ASSIGNMENT_STATUSES.includes(status as ShipmentAssignmentStatus);

// Lo que puede hacer el CONDUCTOR dueño del intento, por estado actual.
// `Cancelled` no está acá: lo hace el admin de la sucursal destino.
export const DRIVER_ASSIGNMENT_TRANSITIONS: Record<
  ShipmentAssignmentStatus,
  ShipmentAssignmentStatus[]
> = {
  Assigned: ['PickedUp'],
  PickedUp: ['Delivered', 'Failed'],
  Delivered: [],
  Failed: [],
  Cancelled: [],
};

// Estado en el que queda el ENVÍO tras cada cambio de la asignación. `Failed` es
// el único que depende de la observación: con `CustomerRefused` el envío queda
// `Rejected`, con cualquier otra queda `Observed` y se puede reasignar.
export const ASSIGNMENT_CASCADE: Record<ShipmentAssignmentStatus, ShipmentStatus | null> = {
  Assigned: 'Assigned',
  PickedUp: 'OutForDelivery',
  Delivered: 'Delivered',
  Failed: 'Observed',
  Cancelled: 'AtDestinationBranch',
};

export const shipmentStatusAfterFailure = (
  observation: ShipmentObservation | '' | null | undefined
): ShipmentStatus => (observation === 'CustomerRefused' ? 'Rejected' : 'Observed');

// `Delivered` exige al menos una foto (`assignment.photos.required`) y `Failed`
// exige observación (`assignment.observation.required`).
export const assignmentRequiresPhotos = (status: ShipmentAssignmentStatus): boolean =>
  status === 'Delivered';

export const assignmentRequiresObservation = (status: ShipmentAssignmentStatus): boolean =>
  status === 'Failed';

export function getAssignmentErrorMessage(err: unknown, fallback: string): string {
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
  return getAssignmentErrorMessage(err, fallback);
}

const isPhotoErrorKey = (key?: string): boolean =>
  !!key && (key.startsWith('assignment.photos.') || key === 'image.upload.failed');

/**
 * `true` cuando el rechazo depende de cuántas fotos hay guardadas o de si el
 * reparto sigue abierto: lo que la pantalla tiene en memoria quedó viejo y hay
 * que volver a leer el reparto antes de reintentar.
 */
export function isStalePhotoState(err: unknown): boolean {
  if (!isApiError(err)) return false;
  return (
    err.errorKey === 'assignment.photos.toomany' ||
    err.errorKey === 'assignment.photos.closed'
  );
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ShipmentAssignment {
  id: string;
  shipmentId: string;
  shipmentCode: string;
  status: ShipmentAssignmentStatus;
  shipmentStatus: ShipmentStatus;
  driverUserId: string;
  driverFullName: string;
  assignedAt: string;
  pickedUpAt?: string | null;
  completedAt?: string | null;
  observation?: ShipmentObservation | null;
  deliveryComment?: string | null;
  photoUrls?: string[] | null;
  // Solo en el listado: cuántas fotos tiene guardadas, para el contador de la
  // tarjeta sin traerse las URLs de cada reparto.
  photoCount?: number | null;
  // Opcionales: el listado los trae para poder pintar la tarjeta sin un GET por
  // fila, pero la lista de campos del listado no está fijada en el contrato, así
  // que la UI degrada al código de guía si no vienen.
  clientFullName?: string | null;
  clientAddress?: string | null;
}

// GET /shipment-assignments/{id}: todo lo que el conductor necesita para ir a
// entregar (cliente, cobro y carga) además del intento en sí.
export interface ShipmentAssignmentDetail extends ShipmentAssignment {
  clientFullName: string;
  clientPhone?: string | null;
  clientAddress: string;
  destinationDepartment?: string | null;
  deliveryType?: string | null;
  totalPrice?: number | null;
  totalWeight: number;
  packageCount: number;
  packageDescription?: string | null;
}

export interface AssignmentsPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: ShipmentAssignment[];
}

export interface AssignmentListFilters {
  // El conductor ve solo lo suyo; para él este filtro se ignora server-side.
  driverUserId?: string;
  shipmentId?: string;
  status?: ShipmentAssignmentStatus | '';
  // `true` → solo `Assigned` y `PickedUp`: la vista "lo que me queda por repartir".
  onlyOpen?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Todo-o-nada. Un envío se asigna solo si está en `AtDestinationBranch` o en
// `Observed` (reintento), llegó a la sucursal del conductor, y no tiene ya otro
// intento vigente. El usuario indicado debe tener rol `conductor` y pertenecer a
// la sucursal destino del envío.
export interface CreateAssignmentsRequest {
  driverUserId: string;
  shipmentIds: string[];
}

export interface CreatedAssignment {
  assignmentId: string;
  shipmentId: string;
  shipmentCode: string;
  assignmentStatus: ShipmentAssignmentStatus;
  shipmentStatus: ShipmentStatus;
  assignedAt: string;
  clientFullName: string;
  clientAddress: string;
}

export interface CreateAssignmentsResponse {
  driverUserId: string;
  driverFullName: string;
  assignedCount: number;
  assignments: CreatedAssignment[];
}

// Sin `photoUrls`: las fotos ya viajaron por `uploadPhotos` y el backend cuenta
// las que tiene guardadas. El campo sigue existiendo en la API por
// compatibilidad, pero está para desaparecer y aceptaría una URL arbitraria de
// cualquier cliente, así que desde acá no se manda más.
export interface ChangeAssignmentStatusRequest {
  status: ShipmentAssignmentStatus;
  observation?: ShipmentObservation;
  deliveryComment?: string;
}

// ─── Fotos de prueba de entrega ──────────────────────────────────────────────
//
// Los archivos van al backend y él los sube al servicio de imágenes. La app no
// toca Cloudinary ni necesita credenciales suyas.
//
// Son dos llamadas separadas (subir fotos, después cambiar el estado) a
// propósito: subir por red móvil es lo que más falla, y si la subida viviera
// dentro del cambio de estado, un reintento arrastraría también la transición
// del envío.

/** Tope por reparto, acumulado entre llamadas. El mínimo para entregar es 1. */
export const MAX_ASSIGNMENT_PHOTOS = 3;

/** 10 MB por archivo, igual que el backend. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Para el `accept` del input: mismos tipos que acepta el backend. */
export const ACCEPTED_PHOTO_TYPES = ACCEPTED_PHOTO_MIME_TYPES.join(',');

export interface UploadAssignmentPhotosResponse {
  assignmentId: string;
  /** TODAS las fotos del reparto, no solo las recién subidas. */
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

export const shipmentAssignmentService = {
  getAssignments: async (
    page = 1,
    perPage = 10,
    filters: AssignmentListFilters = {}
  ): Promise<AssignmentsPaginatedResponse> => {
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
    return apiClient<AssignmentsPaginatedResponse>(`/shipment-assignments?${query.toString()}`);
  },

  getAssignmentById: async (id: string): Promise<ShipmentAssignmentDetail> => {
    return apiClient<ShipmentAssignmentDetail>(`/shipment-assignments/${id}`);
  },

  // Roles: superadmin, admin.
  createAssignments: async (
    data: CreateAssignmentsRequest
  ): Promise<CreateAssignmentsResponse> => {
    return apiClient<CreateAssignmentsResponse>('/shipment-assignments', {
      method: 'POST',
      data,
    });
  },

  /**
   * Sube de 1 a 3 fotos de prueba de entrega. Solo el conductor dueño del
   * reparto y solo mientras siga abierto (`Assigned` o `PickedUp`).
   *
   * El tope de 3 es acumulado: si ya hay 2 guardadas, esta llamada admite 1.
   * La respuesta trae la lista completa, así que el estado local se reemplaza
   * con ella en vez de ir acumulando a mano.
   */
  uploadPhotos: async (
    id: string,
    files: File[]
  ): Promise<UploadAssignmentPhotosResponse> => {
    const form = new FormData();
    // Mismo nombre de campo repetido, uno por archivo: así lo espera el backend.
    for (const file of files) form.append('photos', file);
    return apiClient<UploadAssignmentPhotosResponse>(
      `/shipment-assignments/${id}/photos`,
      { method: 'POST', data: form }
    );
  },

  // Roles: superadmin, admin, conductor. Es la pantalla principal de la app del
  // conductor: mueve la asignación y el envío juntos y registra hora y fotos.
  changeStatus: async (
    id: string,
    data: ChangeAssignmentStatusRequest
  ): Promise<ShipmentAssignmentDetail> => {
    return apiClient<ShipmentAssignmentDetail>(`/shipment-assignments/${id}/status`, {
      method: 'PATCH',
      data,
    });
  },
};
