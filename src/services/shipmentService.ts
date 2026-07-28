import { apiClient } from './apiClient';

// ─── Estados y observaciones ─────────────────────────────────────────────────

export type ShipmentStatus =
  | 'Pending'
  | 'InTransit'
  | 'Observed'
  | 'Delivered'
  | 'Rejected'
  | 'Returned';

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  Pending: 'Pendiente',
  InTransit: 'En tránsito',
  Observed: 'Observado',
  Delivered: 'Entregado',
  Rejected: 'Rechazado',
  Returned: 'Devuelto',
};

// Colores del componente Badge para cada estado.
export const SHIPMENT_STATUS_BADGE: Record<ShipmentStatus, 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark'> = {
  Pending: 'light',
  InTransit: 'info',
  Observed: 'warning',
  Delivered: 'success',
  Rejected: 'error',
  Returned: 'dark',
};

// Transiciones válidas para el cambio manual de estado (Delivered y Returned son finales).
export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  Pending: ['InTransit'],
  InTransit: ['Observed', 'Delivered', 'Rejected', 'Returned'],
  Observed: ['InTransit', 'Delivered', 'Rejected', 'Returned'],
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

// Solo se puede observar un envío en estos estados.
export const OBSERVABLE_STATUSES: ShipmentStatus[] = ['InTransit', 'Observed'];

// Mensajes amigables para las claves de error del backend (vienen en `title`).
export const SHIPMENT_ERROR_MESSAGES: Record<string, string> = {
  'shipment.originbranch.missing':
    'Tu usuario no tiene una sucursal asignada, por lo que no puede atender envíos. Pide al administrador que te asigne una sucursal.',
  'shipment.statuschange.empty': 'Debes indicar un estado, una observación o un comentario.',
  'shipment.statuschange.conflict': 'No se puede mandar estado y observación a la vez.',
  'shipment.statuschange.invalidtransition': 'La transición de estado no está permitida.',
  'shipment.observation.invalidstatus':
    'Solo se puede observar un envío en estado "En tránsito" u "Observado".',
};

export function getShipmentErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return SHIPMENT_ERROR_MESSAGES[msg] ?? msg;
    }
  }
  return fallback;
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
}

export interface ShipmentListFilters {
  supplierId?: string;
  originBranchOfficeId?: string;
  destinationBranchOfficeId?: string;
  status?: ShipmentStatus | '';
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

export interface CreateShipmentRequest {
  orderDeliveryId: string;
  // Sucursal de destino (obligatoria). El origen lo pone el backend con la
  // sucursal del usuario autenticado.
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

export interface CreateSporadicShipmentRequest {
  destinationBranchOfficeId: string;
  originDepartment: string;
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
