import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
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

// Las fotos las sube el front a Cloudinary/S3 y acá van solo las URLs: el
// backend no tiene endpoint de upload (ver `uploadService`).
export interface ChangeAssignmentStatusRequest {
  status: ShipmentAssignmentStatus;
  observation?: ShipmentObservation;
  deliveryComment?: string;
  photoUrls?: string[];
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
