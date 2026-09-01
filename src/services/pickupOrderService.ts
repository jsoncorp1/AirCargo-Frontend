import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
import type { BadgeColor } from './shipmentService';
import type { BolivianDepartment } from './supplierService';
import type { OrderType } from './orderDeliveryService';
import type { DriverTaskStatus } from './driverTaskService';
import type { PaymentType, ServicePointType, VehicleType } from './logisticsEnums';

// Solicitud de recojo: el pedido de que un conductor pase a buscar un paquete
// por un domicilio.
//
// Es el único camino con origen a domicilio. La orden corporativa y el envío
// esporádico despachan siempre desde el mostrador; acá el paquete todavía no
// existe en el sistema, y por eso la solicitud NO es un envío: se convierte en
// uno recién cuando llega al mostrador y se lo pesa (`receive`).

// ─── Ciclo de vida ───────────────────────────────────────────────────────────
//
// Requested ──▶ Confirmed ──▶ Assigned ──▶ InTransit ──▶ Collected ──▶ Received
//     │             │            │             │             │            │
//  la crea      la aprueba   se le da a    el conductor  el paquete   mostrador
//  la empresa   la sucursal  un conductor  salió a       está con     lo pesa y
//                                          buscarlo      él           nace el envío
//
// Cancelled ◀── desde cualquier estado anterior a Received
export type PickupOrderStatus =
  | 'Requested'
  | 'Confirmed'
  | 'Assigned'
  | 'InTransit'
  | 'Collected'
  | 'Received'
  | 'Cancelled';

export const PICKUP_ORDER_STATUS_LABELS: Record<PickupOrderStatus, string> = {
  Requested: 'Solicitado',
  Confirmed: 'Confirmado',
  Assigned: 'Asignado',
  InTransit: 'En camino',
  Collected: 'Recogido',
  Received: 'Recibido',
  Cancelled: 'Anulado',
};

export const PICKUP_ORDER_STATUS_BADGE: Record<PickupOrderStatus, BadgeColor> = {
  Requested: 'light',
  Confirmed: 'primary',
  Assigned: 'primary',
  InTransit: 'info',
  Collected: 'warning',
  Received: 'success',
  Cancelled: 'dark',
};

export const pickupOrderStatusLabel = (status: PickupOrderStatus | string): string =>
  PICKUP_ORDER_STATUS_LABELS[status as PickupOrderStatus] ?? status;

export const pickupOrderStatusBadge = (status: PickupOrderStatus | string): BadgeColor =>
  PICKUP_ORDER_STATUS_BADGE[status as PickupOrderStatus] ?? 'light';

/** Camino feliz, en orden. Es el stepper del detalle; `Cancelled` sale de la línea. */
export const PICKUP_ORDER_STATUS_ORDER: PickupOrderStatus[] = [
  'Requested',
  'Confirmed',
  'Assigned',
  'InTransit',
  'Collected',
  'Received',
];

export const PICKUP_ORDER_STATUS_FILTER_OPTIONS: {
  value: PickupOrderStatus;
  label: string;
}[] = ([...PICKUP_ORDER_STATUS_ORDER, 'Cancelled'] as PickupOrderStatus[]).map(
  (value) => ({ value, label: PICKUP_ORDER_STATUS_LABELS[value] })
);

export interface PickupTimelineStep {
  status: PickupOrderStatus;
  label: string;
  reached: boolean;
  current: boolean;
}

/**
 * Pasos del seguimiento de una solicitud.
 *
 * Una solicitud anulada muestra el camino recorrido hasta donde llegó con
 * `Cancelled` al final: dónde se cortó es justamente el dato que se busca.
 */
export function buildPickupOrderTimeline(
  status: PickupOrderStatus
): PickupTimelineStep[] {
  const cancelled = status === 'Cancelled';
  const steps: PickupOrderStatus[] = cancelled
    ? [...PICKUP_ORDER_STATUS_ORDER.filter((s) => s !== 'Received'), 'Cancelled']
    : [...PICKUP_ORDER_STATUS_ORDER];

  // Un estado desconocido (backend por delante del front) cae en -1; mostrarlo
  // como "nada alcanzado" es preferible a marcar el paso equivocado.
  const currentIndex = steps.indexOf(status);

  return steps.map((s, i) => ({
    status: s,
    label: pickupOrderStatusLabel(s),
    reached: currentIndex >= 0 && i <= currentIndex,
    current: i === currentIndex,
  }));
}

// ─── Qué se puede hacer en cada estado ───────────────────────────────────────

/**
 * Editar SOLO en `Requested`. Una vez confirmada, el estimado es un compromiso
 * y la API rechaza el PUT (`pickuporder.edit.invalidstatus`): el botón tiene que
 * desaparecer, no fallar al apretarlo.
 */
export const canEditPickupOrder = (status: PickupOrderStatus | string): boolean =>
  status === 'Requested';

/** Confirmar solo desde `Requested`. */
export const canConfirmPickupOrder = (status: PickupOrderStatus | string): boolean =>
  status === 'Requested';

/** Asignar conductor solo desde `Confirmed` (incluye reasignar tras un fallido). */
export const canAssignPickupOrder = (status: PickupOrderStatus | string): boolean =>
  status === 'Confirmed';

/** Recibir y pesar solo desde `Collected`: es el paso que crea el envío. */
export const canReceivePickupOrder = (status: PickupOrderStatus | string): boolean =>
  status === 'Collected';

/** Se puede anular desde cualquier estado anterior a `Received`. */
export const canCancelPickupOrder = (status: PickupOrderStatus | string): boolean =>
  status !== 'Received' && status !== 'Cancelled';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface PickupOrderLine {
  articleName: string;
  quantity: number;
  estimatedWeight: number;
  declaredValue: number;
}

/** Una tarea de recojo del historial. Los fallidos quedan acá. */
export interface PickupOrderTask {
  id: string;
  driverUserId: string;
  driverFullName: string;
  status: DriverTaskStatus;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  comment?: string | null;
}

export interface PickupOrderListItem {
  id: string;
  code: string;
  status: PickupOrderStatus;
  orderType: OrderType;
  supplierId?: string | null;
  supplierName?: string | null;
  pickupBranchOfficeId?: string | null;
  pickupBranchOfficeCode?: string | null;
  originDepartment: BolivianDepartment;
  senderName: string;
  pickupAddress: string;
  destinationPointType: ServicePointType;
  destinationDepartment: BolivianDepartment;
  destinationBranchOfficeCode?: string | null;
  recipientName: string;
  pickupDate: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  estimatedWeight: number;
  packageCount: number;
  requestedVehicleType: VehicleType;
  isExpress: boolean;
  paymentType: PaymentType;
  estimatedPrice: number;
  /** De la tarea VIGENTE; null mientras no tenga conductor. */
  driverUserId?: string | null;
  driverFullName?: string | null;
  /** El envío que resultó, cuando ya se recibió. */
  shipmentId?: string | null;
  createdAt: string;
}

export interface PickupOrder extends PickupOrderListItem {
  senderPhone: string;
  pickupLocationUrl: string;
  pickupAddressReference?: string | null;

  destinationBranchOfficeId?: string | null;
  recipientPhone: string;
  recipientPhoneAlt?: string | null;
  destinationAddress?: string | null;
  destinationLocationUrl?: string | null;
  destinationAddressReference?: string | null;

  packageDescription: string;
  comments?: string | null;

  // Desglose de la cotización, para poder explicar de dónde sale cada boliviano.
  estimatedFreight: number;
  estimatedPickupCharge: number;
  estimatedDeliveryCharge: number;

  confirmedAt?: string | null;
  confirmedByEmail?: string | null;
  collectedAt?: string | null;
  receivedAt?: string | null;
  cancellationReason?: string | null;

  shipmentCode?: string | null;

  details: PickupOrderLine[];
  /** Historial completo: sirve para mostrar los intentos fallidos. */
  tasks: PickupOrderTask[];
}

export interface PickupOrdersPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: PickupOrderListItem[];
}

export interface PickupOrderListFilters {
  supplierId?: string;
  pickupBranchOfficeId?: string;
  status?: PickupOrderStatus | '';
  originDepartment?: BolivianDepartment | '';
  /**
   * La AGENDA del mostrador: qué hay que salir a buscar y cuándo (`DateOnly`).
   * No confundir con `dateFrom`/`dateTo`, que filtran por fecha de creación.
   */
  pickupDateFrom?: string;
  pickupDateTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreatePickupOrderRequest {
  /** Solo superadmin, o empresa con más de una sucursal en su departamento. */
  pickupBranchOfficeId?: string | null;

  originDepartment: BolivianDepartment;
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  /** Requerido: sin el enlace de mapa el conductor no encuentra el domicilio. */
  pickupLocationUrl: string;
  pickupAddressReference?: string | null;

  destinationPointType: ServicePointType;
  destinationDepartment: BolivianDepartment;
  /** Requerido si el destino es `Branch`. */
  destinationBranchOfficeId?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneAlt?: string | null;
  /** Los tres requeridos si el destino es `Door`. */
  destinationAddress?: string | null;
  destinationLocationUrl?: string | null;
  destinationAddressReference?: string | null;

  /** No puede ser anterior a hoy en Bolivia (`pickuporder.pickupdate.past`). */
  pickupDate: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;

  /** El que DECLARA el cliente. El que se cobra es el de la balanza. */
  estimatedWeight: number;
  packageCount: number;
  packageDescription: string;
  /**
   * Declaración del cliente, no un cálculo: si el bulto no entra en la moto, el
   * recojo se cierra fallido y hay que volver a pedirlo con auto.
   */
  requestedVehicleType: VehicleType;
  isExpress: boolean;
  paymentType: PaymentType;
  comments?: string | null;

  lines: PickupOrderLine[];
}

export type UpdatePickupOrderRequest = CreatePickupOrderRequest;

/**
 * Solo `Confirmed` y `Cancelled`. El resto del ciclo lo mueve el conductor desde
 * sus tareas.
 */
export interface ChangePickupOrderStatusRequest {
  status: Extract<PickupOrderStatus, 'Confirmed' | 'Cancelled'>;
  /** Obligatorio si `Cancelled`. */
  cancellationReason?: string | null;
}

export interface AssignPickupOrderRequest {
  driverUserId: string;
}

export interface AssignPickupOrderResponse {
  taskId: string;
  pickupOrderId: string;
  driverUserId: string;
  driverFullName: string;
  status: PickupOrderStatus;
}

/**
 * Recepción en mostrador: el paso que CREA el envío.
 *
 * El peso que se cobra es el de la balanza, no el declarado. Si el operador
 * toca el precio hay que exigir el motivo en el mismo formulario: sin él el
 * backend responde `shipment.priceoverride.reasonrequired` y se pierde la carga.
 */
export interface ReceivePickupOrderRequest {
  totalWeight: number;
  packageCount: number;
  packageDescription: string;
  /** Solo para CORREGIR la que declaró la solicitud. */
  destinationBranchOfficeId?: string | null;
  /** `null` = manda la tarifa calculada. */
  shippingPrice?: number | null;
  /** OBLIGATORIO si `shippingPrice` difiere del calculado. */
  priceOverrideReason?: string | null;
}

export interface ReceivePickupOrderResponse {
  shipmentId: string;
  shipmentCode: string;
  pickupOrderId: string;
  totalWeight: number;
  shippingPrice: number;
  calculatedPrice: number;
  priceWasOverridden: boolean;
}

export function getPickupOrderErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const pickupOrderService = {
  getPickupOrders: async (
    page = 1,
    perPage = 10,
    filters: PickupOrderListFilters = {}
  ): Promise<PickupOrdersPaginatedResponse> => {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });
    if (filters.supplierId) query.append('supplierId', filters.supplierId);
    if (filters.pickupBranchOfficeId) {
      query.append('pickupBranchOfficeId', filters.pickupBranchOfficeId);
    }
    if (filters.status) query.append('status', filters.status);
    if (filters.originDepartment) query.append('originDepartment', filters.originDepartment);
    if (filters.pickupDateFrom) query.append('pickupDateFrom', filters.pickupDateFrom);
    if (filters.pickupDateTo) query.append('pickupDateTo', filters.pickupDateTo);
    if (filters.dateFrom) query.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.append('dateTo', filters.dateTo);
    return apiClient<PickupOrdersPaginatedResponse>(`/pickup-orders?${query.toString()}`);
  },

  /**
   * Cantidades por estado desde el `count` del servidor.
   *
   * No se cuentan las filas de una página: el backend recorta `perPage`, así que
   * contar en memoria da de menos y sin avisar.
   */
  getCounts: async (
    filters: PickupOrderListFilters = {},
    statuses: PickupOrderStatus[] = ['Requested', 'Confirmed', 'Collected']
  ): Promise<Record<string, number>> => {
    const results = await Promise.all(
      statuses.map((status) =>
        pickupOrderService.getPickupOrders(1, 1, { ...filters, status })
      )
    );
    return Object.fromEntries(statuses.map((s, i) => [s, results[i].count]));
  },

  getPickupOrderById: async (id: string): Promise<PickupOrder> => {
    return apiClient<PickupOrder>(`/pickup-orders/${id}`);
  },

  /** Roles: superadmin, admin, usuarioempresa. Queda en `Requested`. */
  createPickupOrder: async (data: CreatePickupOrderRequest): Promise<PickupOrder> => {
    return apiClient<PickupOrder>('/pickup-orders', { method: 'POST', data });
  },

  /** Solo en `Requested` (`pickuporder.edit.invalidstatus`). */
  updatePickupOrder: async (
    id: string,
    data: UpdatePickupOrderRequest
  ): Promise<PickupOrder> => {
    return apiClient<PickupOrder>(`/pickup-orders/${id}`, { method: 'PUT', data });
  },

  changeStatus: async (
    id: string,
    data: ChangePickupOrderStatusRequest
  ): Promise<PickupOrder> => {
    return apiClient<PickupOrder>(`/pickup-orders/${id}/status`, {
      method: 'PATCH',
      data,
    });
  },

  /**
   * Solo desde `Confirmed`. El selector de conductor tiene que alimentarse de
   * `driverService.getAvailableDrivers(requestedVehicleType)`: el backend valida
   * que el vehículo coincida, que el conductor tenga perfil y que un esporádico
   * esté en línea.
   */
  assignDriver: async (
    id: string,
    data: AssignPickupOrderRequest
  ): Promise<AssignPickupOrderResponse> => {
    return apiClient<AssignPickupOrderResponse>(`/pickup-orders/${id}/assign`, {
      method: 'POST',
      data,
    });
  },

  /** Solo desde `Collected`, rol admin o superadmin. Devuelve el envío creado. */
  receive: async (
    id: string,
    data: ReceivePickupOrderRequest
  ): Promise<ReceivePickupOrderResponse> => {
    return apiClient<ReceivePickupOrderResponse>(`/pickup-orders/${id}/receive`, {
      method: 'POST',
      data,
    });
  },

  /**
   * Baja lógica, admin / superadmin. Falla si ya generó un envío
   * (`pickuporder.delete.hasshipment`) o si tiene una tarea abierta
   * (`pickuporder.delete.hasopentask`).
   */
  deletePickupOrder: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/pickup-orders/${id}`, { method: 'DELETE' });
  },
};
