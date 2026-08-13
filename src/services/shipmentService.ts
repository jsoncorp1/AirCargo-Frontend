import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
// `import type` a propósito: manifestService y shipmentAssignmentService importan
// `ShipmentStatus` de acá. Al ser solo tipos, el import se borra al compilar y no
// queda un ciclo en runtime.
import type { ManifestStatus } from './manifestService';
import type { ShipmentAssignmentStatus } from './shipmentAssignmentService';

// ─── Estados y observaciones ─────────────────────────────────────────────────

// El estado del envío casi nunca se cambia a mano: lo arrastra el manifiesto
// durante el viaje entre sucursales (§manifestService) y la asignación durante
// el reparto final (§shipmentAssignmentService). `PATCH /shipments/{id}/status`
// queda para correcciones del admin.
//
//                         ┌─── manifiesto ────┐
// AtOriginBranch → InManifest → InTransit → AtDestinationBranch
//       ↑              │                            │
//       └──────────────┘                            │
//    (se saca del lote)          ┌─── asignación ───┘
//                                ↓
//                             Assigned → OutForDelivery → Delivered
//                                ↑            │
//                                │            ├──→ Observed ──→ (se reasigna)
//                                └────────────┤
//                                             └──→ Rejected ──┴──→ Returned
export type ShipmentStatus =
  | 'AtOriginBranch'
  | 'InManifest'
  | 'InTransit'
  | 'AtDestinationBranch'
  | 'Assigned'
  | 'OutForDelivery'
  | 'Observed'
  | 'Delivered'
  | 'Rejected'
  | 'Returned';

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  AtOriginBranch: 'En sucursal origen',
  InManifest: 'En manifiesto',
  InTransit: 'En tránsito',
  AtDestinationBranch: 'En sucursal destino',
  Assigned: 'Asignado',
  OutForDelivery: 'En reparto',
  Observed: 'Observado',
  Delivered: 'Entregado',
  Rejected: 'Rechazado',
  Returned: 'Devuelto',
};

export type BadgeColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark';

// Colores del componente Badge para cada estado.
export const SHIPMENT_STATUS_BADGE: Record<ShipmentStatus, BadgeColor> = {
  AtOriginBranch: 'light',
  InManifest: 'primary',
  InTransit: 'info',
  AtDestinationBranch: 'primary',
  Assigned: 'primary',
  OutForDelivery: 'info',
  Observed: 'warning',
  Delivered: 'success',
  Rejected: 'error',
  Returned: 'dark',
};

// Un envío traído de la API puede venir con un estado que este build todavía no
// conoce (backend por delante del front). Leer los mapas por estas funciones en
// vez de indexar el Record evita renderizar una etiqueta vacía.
export const shipmentStatusLabel = (status: ShipmentStatus | string): string =>
  SHIPMENT_STATUS_LABELS[status as ShipmentStatus] ?? status;

export const shipmentStatusBadge = (status: ShipmentStatus | string): BadgeColor =>
  SHIPMENT_STATUS_BADGE[status as ShipmentStatus] ?? 'light';

// Camino feliz, en orden. Los estados de excepción (Observed/Rejected/Returned)
// se salen de esta línea y se tratan aparte en el timeline.
export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  'AtOriginBranch',
  'InManifest',
  'InTransit',
  'AtDestinationBranch',
  'Assigned',
  'OutForDelivery',
  'Delivered',
];

export const SHIPMENT_EXCEPTION_STATUSES: ShipmentStatus[] = [
  'Observed',
  'Rejected',
  'Returned',
];

export const isExceptionStatus = (status: ShipmentStatus | string): boolean =>
  SHIPMENT_EXCEPTION_STATUSES.includes(status as ShipmentStatus);

// Lista ordenada para los filtros de estado, compartida por todas las pantallas
// (toolbar del superadmin, tabs del admin, select del conductor y del proveedor)
// para que ninguna se quede con un subconjunto viejo hardcodeado.
export const SHIPMENT_STATUS_FILTER_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  ...SHIPMENT_STATUS_ORDER,
  ...SHIPMENT_EXCEPTION_STATUSES,
].map((value) => ({ value, label: SHIPMENT_STATUS_LABELS[value] }));

export interface TimelineStep {
  status: ShipmentStatus;
  label: string;
  reached: boolean;
  current: boolean;
  // Los pasos de excepción se pintan en rojo en vez de en color de marca.
  exception: boolean;
}

/**
 * Pasos a mostrar en el seguimiento de un envío.
 *
 * El camino feliz es `SHIPMENT_STATUS_ORDER`. Si el envío se desvió
 * (Observed/Rejected/Returned) la desviación ocurre siempre en la calle, así que
 * el paso de excepción reemplaza a `Delivered` al final de la línea.
 *
 * `isLocal` (sucursal origen = destino) salta el tramo de manifiesto: ese envío
 * nace directamente en `AtDestinationBranch` y no viaja a ningún lado.
 */
export function buildShipmentTimeline(
  status: ShipmentStatus,
  isLocal = false
): TimelineStep[] {
  const happyPath = isLocal
    ? SHIPMENT_STATUS_ORDER.filter((s) => s !== 'InManifest' && s !== 'InTransit')
    : SHIPMENT_STATUS_ORDER;

  const exception = isExceptionStatus(status);
  const steps: ShipmentStatus[] = exception
    ? [...happyPath.filter((s) => s !== 'Delivered'), status]
    : [...happyPath];

  // Un estado desconocido (backend por delante del front) cae en -1; mostrarlo
  // como "nada alcanzado" es preferible a marcar el paso equivocado.
  const currentIndex = steps.indexOf(status);

  return steps.map((s, i) => ({
    status: s,
    label: shipmentStatusLabel(s),
    reached: currentIndex >= 0 && i <= currentIndex,
    current: i === currentIndex,
    exception: isExceptionStatus(s),
  }));
}

// Transiciones del cambio MANUAL (`PATCH /shipments/{id}/status`, solo
// superadmin/admin). Espejo conservador de `ShipmentStatusRules` del backend:
// solo se listan las que la documentación del API confirma explícitamente.
//
//   InTransit → AtDestinationBranch  desatasca los envíos anteriores al
//                                    manifiesto, que quedaron en tránsito sin lote.
//   Observed / Rejected → Returned   la devolución es un cambio manual del admin.
//
// El resto del ciclo lo mueven el manifiesto y la asignación; el backend
// rechaza cualquier otra con `shipment.statuschange.invalidtransition`.
export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  AtOriginBranch: [],
  InManifest: [],
  InTransit: ['AtDestinationBranch'],
  AtDestinationBranch: [],
  Assigned: [],
  OutForDelivery: [],
  Observed: ['Returned'],
  Rejected: ['Returned'],
  Delivered: [],
  Returned: [],
};

export type ShipmentObservation =
  | 'CustomerRefused'
  | 'NoAnswerDay1'
  | 'NoAnswerDay2'
  | 'NoAnswerDay3'
  | 'CustomerTraveling'
  | 'WrongPhoneNumber'
  | 'TooFar'
  | 'NotDeliveredOnTime'
  | 'InProvince';

export const SHIPMENT_OBSERVATION_LABELS: Record<ShipmentObservation, string> = {
  CustomerRefused: 'No quiere',
  NoAnswerDay1: 'No contesta día 1',
  NoAnswerDay2: 'No contesta día 2',
  NoAnswerDay3: 'No contesta día 3',
  CustomerTraveling: 'Está de viaje',
  WrongPhoneNumber: 'Número incorrecto',
  TooFar: 'Muy lejos',
  NotDeliveredOnTime: 'No se entregó a tiempo',
  InProvince: 'En provincia',
};

// Solo se puede observar un envío que está "en la calle". La observación normal
// la registra el conductor desde su asignación
// (`shipmentAssignmentService.changeStatus` con `Failed`); esto es el equivalente
// manual del admin sobre `PATCH /shipments/{id}/status`.
export const OBSERVABLE_STATUSES: ShipmentStatus[] = ['OutForDelivery', 'Observed'];

// Los mensajes por clave de error viven en un único mapa central (apiClient ya
// traduce el `title` del ProblemDetails al lanzar el error). Esto es sólo el
// alias que usan los componentes de envíos; incluye el 409 de concurrencia.
export function getShipmentErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ShipmentDetailItem {
  id: string;
  orderDeliveryDetailId: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  weight: number;
  shippingCost: number;
}

export interface Shipment {
  id: string;
  orderDeliveryId: string;
  waybillNumber: string;
  code: string;
  originDepartment: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  clientFullName: string;
  clientAddress: string;
  clientPhone?: string | null;
  destinationDepartment: string;
  totalWeight: number;
  shippingPrice: number;
  packageCount: number;
  packageDescription: string;
  createdAt: string;
  createdBy: string;
  details: ShipmentDetailItem[];
  // Multisucursal: null en envíos creados antes del cambio.
  originBranchOfficeId?: string | null;
  originBranchOfficeCode?: string | null;
  originBranchOfficeCity?: string | null;
  destinationBranchOfficeId?: string | null;
  destinationBranchOfficeCode?: string | null;
  destinationBranchOfficeCity?: string | null;
  status: ShipmentStatus;
  observation?: ShipmentObservation | null;
  deliveryComment?: string | null;
  // Manifiesto en el que viaja (null mientras espera en mostrador y en los
  // envíos locales, que no pasan por lote).
  manifestId?: string | null;
  manifestCode?: string | null;
  manifestStatus?: ManifestStatus | null;
  // Intento de reparto VIGENTE. Los cerrados quedan como historial y se
  // consultan con `shipmentAssignmentService.getAssignments({ shipmentId })`.
  currentAssignment?: ShipmentCurrentAssignment | null;
}

// Resumen del intento de reparto vigente que viene embebido en `GET /shipments/{id}`.
export interface ShipmentCurrentAssignment {
  id: string;
  driverUserId: string;
  driverFullName: string;
  driverPhoneNumber?: string | null;
  status: ShipmentAssignmentStatus;
  assignedAt: string;
  pickedUpAt?: string | null;
  completedAt?: string | null;
}

export interface ShipmentPaginatedItem {
  id: string;
  orderDeliveryId: string;
  waybillNumber: string;
  code: string;
  clientFullName: string;
  totalWeight: number;
  shippingPrice: number;
  packageCount: number;
  createdAt: string;
  supplierId?: string | null;
  originBranchOfficeId?: string | null;
  originBranchOfficeCode?: string | null;
  destinationBranchOfficeId?: string | null;
  destinationBranchOfficeCode?: string | null;
  status: ShipmentStatus;
  observation?: ShipmentObservation | null;
  // null mientras el envío no está en ningún lote.
  manifestId?: string | null;
  manifestCode?: string | null;
}

export interface ShipmentListFilters {
  supplierId?: string;
  originBranchOfficeId?: string;
  destinationBranchOfficeId?: string;
  status?: ShipmentStatus | '';
  // Los envíos de un manifiesto puntual.
  manifestId?: string;
  // `true` → solo los que todavía no están en ningún lote. Combinado con
  // `status: 'AtOriginBranch'` da la lista de candidatos para armar un manifiesto.
  unmanifested?: boolean;
  // Rango sobre la fecha de creación del envío, en formato `yyyy-MM-dd`.
  // Ambos extremos son inclusive y el backend cubre el día completo en `dateTo`.
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface ShipmentsPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: ShipmentPaginatedItem[];
}

export interface CreateShipmentLineRequest {
  orderDeliveryDetailId: string;
  weight: number;
  shippingCost: number;
}

// Sucursal de origen del envío = la sucursal desde la que se está atendiendo.
//
// El backend la resuelve por ámbito del usuario, no por rol:
//   admin / conductor → usa SIEMPRE su propia sucursal e IGNORA este campo;
//   superadmin        → usa este campo, y es obligatorio (es global, no tiene
//                       sucursal propia): sin él responde 400 `*.originbranch.required`;
//   usuarioempresa    → rechazado con `*.originbranch.missing` (no atiende mostrador).
//
// Como para admin/conductor se ignora en vez de rechazarse, el front puede
// mandarlo siempre sin lógica condicional en el envío del payload.
export interface ShipmentOriginRequest {
  originBranchOfficeId?: string | null;
}

export interface CreateShipmentRequest extends ShipmentOriginRequest {
  orderDeliveryId: string;
  // Sucursal de destino (obligatoria).
  destinationBranchOfficeId: string;
  packageCount: number;
  packageDescription: string;
  lines: CreateShipmentLineRequest[];
}

export interface UpdateShipmentLineRequest {
  shipmentDetailId: string;
  weight: number;
  shippingCost: number;
}

export interface UpdateShipmentRequest {
  packageCount: number;
  packageDescription: string;
  lines: UpdateShipmentLineRequest[];
}

// ─── DTOs: envío esporádico (mostrador) ────────────────────────────────────────

export interface CreateSporadicShipmentLineRequest {
  articleName: string;
  quantity: number;
  unitPrice: number;
  weight: number;
  shippingCost: number;
}

// El origen sigue las mismas reglas que en el envío normal (ver
// `ShipmentOriginRequest`). En el esporádico, además, la sucursal de origen
// define el departamento de origen de la orden que se genera.
export interface CreateSporadicShipmentRequest extends ShipmentOriginRequest {
  destinationBranchOfficeId: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  destinationDepartment: string;
  clientPhone: string;
  clientFullName: string;
  clientAddress: string;
  deliveryType: string;
  isExpress: boolean;
  packageCount: number;
  packageDescription: string;
  lines: CreateSporadicShipmentLineRequest[];
}

export interface SporadicShipmentDetailItem {
  orderDeliveryDetailId: string;
  shipmentDetailId: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  weight: number;
  shippingCost: number;
}

export interface SporadicShipmentResponse {
  orderDeliveryId: string;
  shipmentId: string;
  code: string;
  isExpress: boolean;
  totalPrice: number;
  totalWeight: number;
  shippingPrice: number;
  packageCount: number;
  packageDescription: string;
  details: SporadicShipmentDetailItem[];
}

// ─── DTOs: cambio de estado / observación ─────────────────────────────────────

// Mandar `status` o `observation`, no ambos (la observación define el estado sola).
// `deliveryComment` puede ir solo o acompañando a cualquiera de los dos.
export interface ChangeShipmentStatusRequest {
  status?: ShipmentStatus;
  observation?: ShipmentObservation;
  deliveryComment?: string;
}

export interface ChangeShipmentStatusResponse {
  id: string;
  code: string;
  status: ShipmentStatus;
  observation?: ShipmentObservation | null;
  deliveryComment?: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const shipmentService = {
  getShipments: async (
    page = 1,
    perPage = 10,
    filters: ShipmentListFilters = {}
  ): Promise<ShipmentsPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
    if (filters.supplierId) query.append('supplierId', filters.supplierId);
    if (filters.originBranchOfficeId) query.append('originBranchOfficeId', filters.originBranchOfficeId);
    if (filters.destinationBranchOfficeId) query.append('destinationBranchOfficeId', filters.destinationBranchOfficeId);
    if (filters.status) query.append('status', filters.status);
    if (filters.manifestId) query.append('manifestId', filters.manifestId);
    if (filters.unmanifested) query.append('unmanifested', 'true');
    if (filters.dateFrom) query.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.append('dateTo', filters.dateTo);
    return apiClient<ShipmentsPaginatedResponse>(`/shipments?${query.toString()}`);
  },

  getShipmentById: async (id: string): Promise<Shipment> => {
    return apiClient<Shipment>(`/shipments/${id}`);
  },

  createShipment: async (data: CreateShipmentRequest): Promise<Shipment> => {
    return apiClient<Shipment>('/shipments', {
      method: 'POST',
      data,
    });
  },

  updateShipment: async (
    id: string,
    data: UpdateShipmentRequest
  ): Promise<Shipment> => {
    return apiClient<Shipment>(`/shipments/${id}`, {
      method: 'PUT',
      data,
    });
  },

  deleteShipment: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/shipments/${id}`, {
      method: 'DELETE',
    });
  },

  changeShipmentStatus: async (
    id: string,
    data: ChangeShipmentStatusRequest
  ): Promise<ChangeShipmentStatusResponse> => {
    return apiClient<ChangeShipmentStatusResponse>(`/shipments/${id}/status`, {
      method: 'PATCH',
      data,
    });
  },

  createSporadicShipment: async (
    data: CreateSporadicShipmentRequest
  ): Promise<SporadicShipmentResponse> => {
    return apiClient<SporadicShipmentResponse>('/shipments/sporadic', {
      method: 'POST',
      data,
    });
  },
};
