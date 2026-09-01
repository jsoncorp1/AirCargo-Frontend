import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
// `import type` a propósito: manifestService y driverTaskService importan
// `ShipmentStatus` de acá. Al ser solo tipos, el import se borra al compilar y no
// queda un ciclo en runtime.
import type { ManifestStatus } from './manifestService';
import type { DriverTaskStatus } from './driverTaskService';
import type { PaymentMethod, PaymentType, ServicePointType, VehicleType } from './logisticsEnums';

// ─── Estados y observaciones ─────────────────────────────────────────────────

// El estado del envío casi nunca se cambia a mano: lo arrastra el manifiesto
// durante el viaje entre sucursales (§manifestService) y la tarea del conductor
// durante el reparto final (§driverTaskService). `PATCH /shipments/{id}/status`
// queda para correcciones del admin.
//
// Desde la Fase 2 la última milla tiene DOS finales según cómo termine el
// envío. Si el destino es un domicilio va un conductor; si es una sucursal, el
// envío espera a que lo vengan a buscar y se cierra con el registro del retiro
// (`PATCH /shipments/{id}/handover`).
//
//                         ┌─── manifiesto ────┐
// AtOriginBranch → InManifest → InTransit → AtDestinationBranch
//       ↑              │                            │
//       └──────────────┘                            ├── destino Branch ──┐
//    (se saca del lote)     ┌── destino Door ───────┘                    ↓
//                           ↓                              AwaitingCustomerPickup
//                        Assigned → OutForDelivery → Delivered ←─────────┘
//                           ↑            │
//                           │            ├──→ Observed ──→ (se reasigna)
//                           └────────────┤
//                                        └──→ Rejected ──┴──→ Returned
export type ShipmentStatus =
  | 'AtOriginBranch'
  | 'InManifest'
  | 'InTransit'
  | 'AtDestinationBranch'
  // Llegó a la sucursal de destino y espera que el cliente lo retire. Un envío
  // en este estado NO se asigna a un conductor: se cierra con el retiro.
  | 'AwaitingCustomerPickup'
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
  AwaitingCustomerPickup: 'Esperando retiro',
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
  AwaitingCustomerPickup: 'warning',
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

// Camino feliz del envío que se ENTREGA A DOMICILIO, en orden. Los estados de
// excepción (Observed/Rejected/Returned) se salen de esta línea y se tratan
// aparte en el timeline.
export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  'AtOriginBranch',
  'InManifest',
  'InTransit',
  'AtDestinationBranch',
  'Assigned',
  'OutForDelivery',
  'Delivered',
];

// Camino feliz del envío que el cliente RETIRA EN MOSTRADOR. No pasa por ningún
// conductor: de la sucursal de destino va directo a esperar el retiro.
export const SHIPMENT_COUNTER_STATUS_ORDER: ShipmentStatus[] = [
  'AtOriginBranch',
  'InManifest',
  'InTransit',
  'AtDestinationBranch',
  'AwaitingCustomerPickup',
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
// `AwaitingCustomerPickup` se intercala donde ocurre —después de llegar a la
// sucursal de destino—: es la cola de "qué está esperando que lo vengan a
// buscar", y sin filtro propio esa cola no se puede mirar.
export const SHIPMENT_STATUS_FILTER_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  'AtOriginBranch',
  'InManifest',
  'InTransit',
  'AtDestinationBranch',
  'AwaitingCustomerPickup',
  'Assigned',
  'OutForDelivery',
  'Delivered',
  ...SHIPMENT_EXCEPTION_STATUSES,
].map((value) => ({
  value: value as ShipmentStatus,
  label: SHIPMENT_STATUS_LABELS[value as ShipmentStatus],
}));

export interface TimelineStep {
  status: ShipmentStatus;
  label: string;
  reached: boolean;
  current: boolean;
  // Los pasos de excepción se pintan en rojo en vez de en color de marca.
  exception: boolean;
}

export interface ShipmentTimelineOptions {
  /** Sucursal origen = destino: el envío no viaja, salta el tramo de manifiesto. */
  isLocal?: boolean;
  /**
   * Cómo termina el envío. `Branch` (retiro en mostrador) cambia el final de la
   * línea: no hay conductor, hay una espera. Si no se pasa, se deduce del
   * estado actual — que solo alcanza una vez que el envío ya llegó.
   */
  destinationPointType?: ServicePointType | null;
}

/**
 * Pasos a mostrar en el seguimiento de un envío.
 *
 * Hay dos caminos felices y los separa la modalidad de destino: a domicilio
 * termina con un conductor (`SHIPMENT_STATUS_ORDER`), en mostrador termina
 * esperando el retiro (`SHIPMENT_COUNTER_STATUS_ORDER`).
 *
 * Si el envío se desvió (Observed/Rejected/Returned) la desviación ocurre
 * siempre en la calle, así que el paso de excepción reemplaza a `Delivered` al
 * final de la línea.
 */
export function buildShipmentTimeline(
  status: ShipmentStatus,
  options: ShipmentTimelineOptions = {}
): TimelineStep[] {
  const { isLocal = false, destinationPointType } = options;

  // Sin la modalidad a mano (listados viejos, envíos anteriores al campo) el
  // estado la delata en cuanto el envío llega: solo un retiro en mostrador pasa
  // por `AwaitingCustomerPickup`.
  const isCounterPickup =
    destinationPointType === 'Branch' || status === 'AwaitingCustomerPickup';

  const fullPath = isCounterPickup
    ? SHIPMENT_COUNTER_STATUS_ORDER
    : SHIPMENT_STATUS_ORDER;

  const happyPath = isLocal
    ? fullPath.filter((s) => s !== 'InManifest' && s !== 'InTransit')
    : fullPath;

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
  // El paso a `Delivered` NO va por acá: el retiro se registra con
  // `registerHandover`, que además guarda a quién se le entregó.
  AwaitingCustomerPickup: [],
  Assigned: [],
  OutForDelivery: [],
  Observed: ['Returned'],
  Rejected: ['Returned'],
  Delivered: [],
  Returned: [],
};

/**
 * `true` cuando el envío espera que el cliente lo retire del mostrador.
 *
 * En ese estado el botón de asignar conductor NO va: va el de registrar el
 * retiro. Son mutuamente excluyentes y la máquina de estados del backend lo
 * impide, así que la UI tiene que reflejarlo en vez de dejar apretar y fallar.
 */
export const isAwaitingCustomerPickup = (status: ShipmentStatus | string): boolean =>
  status === 'AwaitingCustomerPickup';

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
  // Tarea de reparto VIGENTE. Las cerradas quedan como historial y se consultan
  // con `driverTaskService.getTasks({ shipmentId })`.
  currentAssignment?: ShipmentCurrentAssignment | null;

  // ─── Fase 2 ────────────────────────────────────────────────────────────────

  // Modalidad de cada punta. El origen es `Branch` salvo que el envío haya
  // nacido de una solicitud de recojo.
  originPointType?: ServicePointType | null;
  destinationPointType?: ServicePointType | null;
  paymentType?: PaymentType | null;
  paymentMethod?: PaymentMethod | null;
  clientPhoneAlt?: string | null;
  destinationLocationUrl?: string | null;
  destinationAddressReference?: string | null;

  // De qué solicitud de recojo nació, si nació de una.
  pickupOrderId?: string | null;
  pickupOrderCode?: string | null;

  // Auditoría del precio: qué dijo la tarifa, qué se cobró y quién lo cambió.
  // Con esto la pantalla puede mostrar "tarifa 94 Bs → cobrado 90 Bs".
  calculatedPrice?: number | null;
  appliedShippingRateId?: string | null;
  priceOverrideReason?: string | null;
  /** El CORREO de quien ajustó el precio, como toda la autoría de la API. */
  priceOverrideBy?: string | null;

  // Constancia del retiro en mostrador.
  handoverToName?: string | null;
  handoverToDocument?: string | null;
  handoverAt?: string | null;
}

// Resumen de la tarea de reparto vigente que viene embebida en `GET /shipments/{id}`.
export interface ShipmentCurrentAssignment {
  id: string;
  driverUserId: string;
  driverFullName: string;
  driverPhoneNumber?: string | null;
  status: DriverTaskStatus;
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
  // Fase 2: alcanza para el badge de modalidad, el semáforo de ajuste de precio
  // y la columna de retiro, sin un GET por fila.
  destinationPointType?: ServicePointType | null;
  paymentType?: PaymentType | null;
  paymentMethod?: PaymentMethod | null;
  pickupOrderId?: string | null;
  calculatedPrice?: number | null;
  handoverAt?: string | null;
}

/**
 * `true` cuando lo que se cobró no es lo que dijo la tarifa.
 *
 * El motivo y el autor del ajuste vienen en el detalle (`priceOverrideReason`,
 * `priceOverrideBy`); en el listado alcanza con marcar la fila.
 */
export const wasPriceOverridden = (shipment: {
  shippingPrice: number;
  calculatedPrice?: number | null;
}): boolean =>
  typeof shipment.calculatedPrice === 'number' &&
  Math.abs(shipment.calculatedPrice - shipment.shippingPrice) > 0.001;

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

// El costo por línea YA NO VA en el alta.
//
// El precio no se carga a mano: sale de la tarifa vigente y el backend lo
// reparte entre las líneas en proporción a su peso. Sigue viniendo en la
// RESPUESTA (`ShipmentDetailItem.shippingCost`), ya calculado.
export interface CreateShipmentLineRequest {
  orderDeliveryDetailId: string;
  weight: number;
}

/**
 * Lo que define el precio en los tres caminos de alta de envío.
 *
 * Sin tarifa cargada para la ruta, los tres fallan con `pricing.rate.notfound`
 * o `pricing.doorrate.notfound`. Es deliberado: el sistema no inventa precios.
 */
export interface ShipmentPricingRequest {
  /**
   * Define el cargo de puerta. Solo pesa si el destino es domicilio: en un
   * retiro en mostrador no se cobra viaje.
   */
  deliveryVehicleType: VehicleType;
  /** `null` = manda la tarifa calculada. Cualquier otro valor es un ajuste. */
  shippingPrice?: number | null;
  /**
   * OBLIGATORIO si `shippingPrice` difiere del calculado
   * (`shipment.priceoverride.reasonrequired`). Hay que pedirlo en el MISMO
   * formulario: sin él se pierde toda la carga.
   */
  priceOverrideReason?: string | null;
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

export interface CreateShipmentRequest
  extends ShipmentOriginRequest,
    ShipmentPricingRequest {
  orderDeliveryId: string;
  paymentMethod?: PaymentMethod | null;
  // Sucursal de destino (obligatoria).
  destinationBranchOfficeId: string;
  packageCount: number;
  packageDescription: string;
  lines: CreateShipmentLineRequest[];
}

export interface UpdateShipmentLineRequest {
  shipmentDetailId: string;
  weight: number;
}

// El PUT RECOTIZA con el peso corregido: cambiar el peso ahora cambia el
// precio, en vez de dejar el importe viejo. Si el envío está fiado, también
// corrige la línea de la cuenta corriente cuando el período sigue abierto.
export interface UpdateShipmentRequest extends ShipmentPricingRequest {
  paymentMethod?: PaymentMethod | null;
  packageCount: number;
  packageDescription: string;
  lines: UpdateShipmentLineRequest[];
}

// ─── DTOs: envío esporádico (mostrador) ────────────────────────────────────────

// Igual que en el envío normal: sin `shippingCost`, el precio sale de la tarifa.
export interface CreateSporadicShipmentLineRequest {
  articleName: string;
  quantity: number;
  unitPrice: number;
  weight: number;
}

// El origen sigue las mismas reglas que en el envío normal (ver
// `ShipmentOriginRequest`). En el esporádico, además, la sucursal de origen
// define el departamento de origen de la orden que se genera.
//
// El origen es SIEMPRE mostrador y no se elige: un origen a domicilio es una
// solicitud de recojo, que crea su propia orden al recibirse.
export interface CreateSporadicShipmentRequest
  extends ShipmentOriginRequest,
    ShipmentPricingRequest {
  destinationBranchOfficeId: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  destinationDepartment: string;
  // `Branch` → `destinationBranchOfficeId` obligatorio; `Door` → `clientAddress`
  // obligatorio. El enlace de mapa acá es deseable, no requerido.
  destinationPointType: ServicePointType;
  clientPhone: string;
  clientPhoneAlt?: string | null;
  clientFullName: string;
  clientAddress: string;
  destinationLocationUrl?: string | null;
  destinationAddressReference?: string | null;
  /**
   * `OnAccount` NO se ofrece acá: un esporádico no tiene empresa a la que
   * cargarle el fiado y el backend responde `billing.supplier.required`.
   */
  paymentType: PaymentType;
  paymentMethod?: PaymentMethod | null;
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
  paymentMethod?: PaymentMethod | null;
  // Para poder mostrar "tarifa 94 Bs → cobrado 90 Bs" en la misma pantalla.
  calculatedPrice?: number | null;
  priceWasOverridden?: boolean | null;
}

// ─── DTOs: retiro en mostrador ────────────────────────────────────────────────

/**
 * Constancia del retiro: `AwaitingCustomerPickup → Delivered`.
 *
 * Roles admin / superadmin. Es lo que reemplaza al reparto cuando el envío
 * termina en sucursal: no hay conductor al que asignárselo.
 */
export interface HandoverShipmentRequest {
  handoverToName: string;
  handoverToDocument: string;
  /** Opcional, ya subida. */
  photoUrl?: string | null;
}

export interface HandoverShipmentResponse {
  id: string;
  code: string;
  status: ShipmentStatus;
  handoverToName: string;
  handoverToDocument: string;
  handoverAt: string;
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

  /**
   * Registra el retiro en mostrador y cierra el envío como entregado.
   *
   * Solo desde `AwaitingCustomerPickup`. En ese estado el botón de asignar
   * conductor no existe: son acciones mutuamente excluyentes.
   */
  registerHandover: async (
    id: string,
    data: HandoverShipmentRequest
  ): Promise<HandoverShipmentResponse> => {
    return apiClient<HandoverShipmentResponse>(`/shipments/${id}/handover`, {
      method: 'PATCH',
      data,
    });
  },
};
