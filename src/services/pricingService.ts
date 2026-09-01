import { apiClient } from './apiClient';
import { getApiErrorMessage, isApiError } from './apiErrorMessages';
import type { BolivianDepartment } from './supplierService';
import type { ServicePointType, VehicleType } from './logisticsEnums';

// Cotizador y tarifario.
//
// El precio del envío NO se carga a mano en ningún lado: sale de la tarifa
// vigente. El mostrador puede ajustarlo, pero entonces tiene que decir por qué.
//
// Fórmula del flete:
//   flete = primerKilo + (kgFacturable − 1) × kiloAdicional
// más el cargo de puerta UNA VEZ por cada extremo que sea `Door`. Un
// Branch → Branch no paga viaje.

// ─── Cotización ──────────────────────────────────────────────────────────────

export interface QuoteRequest {
  // Solo lo manda el mostrador. Una empresa cotiza con la suya y el backend
  // ignora lo que venga acá.
  supplierId?: string | null;
  originDepartment: BolivianDepartment | string;
  destinationDepartment: BolivianDepartment | string;
  originPointType: ServicePointType;
  destinationPointType: ServicePointType;
  weight: number;
  isExpress: boolean;
  vehicleType: VehicleType;
}

export interface QuoteResponse {
  freight: number;
  pickupCharge: number;
  deliveryCharge: number;
  total: number;
  /** El peso redondeado HACIA ARRIBA: sirve para explicar el salto de precio. */
  chargeableKg: number;
  shippingRateId?: string | null;
}

// ─── Tarifas de flete ────────────────────────────────────────────────────────

export interface ShippingRate {
  id: string;
  // `null` = tarifa PÚBLICA: la que se aplica a los envíos esporádicos y a toda
  // empresa que no tenga una propia. En la grilla se etiqueta así, no como
  // "sin empresa".
  supplierId?: string | null;
  supplierName?: string | null;
  originDepartment: BolivianDepartment;
  destinationDepartment: BolivianDepartment;
  // Fila APARTE, no un recargo: para cubrir una ruta hay que cargar dos
  // tarifas, la normal y la expresa.
  isExpress: boolean;
  firstKgPrice: number;
  additionalKgPrice: number;
  validFrom: string;
  /** `null` = es la vigencia que rige hoy. */
  validTo?: string | null;
}

export interface CreateShippingRateRequest {
  supplierId?: string | null;
  originDepartment: BolivianDepartment;
  destinationDepartment: BolivianDepartment;
  isExpress: boolean;
  firstKgPrice: number;
  additionalKgPrice: number;
  /** Omitir = rige desde hoy. */
  validFrom?: string | null;
}

// ─── Tarifas de puerta ───────────────────────────────────────────────────────

export interface DoorServiceRate {
  id: string;
  supplierId?: string | null;
  supplierName?: string | null;
  department: BolivianDepartment;
  vehicleType: VehicleType;
  tripCost: number;
  validFrom: string;
  validTo?: string | null;
}

export interface CreateDoorServiceRateRequest {
  supplierId?: string | null;
  department: BolivianDepartment;
  vehicleType: VehicleType;
  tripCost: number;
  validFrom?: string | null;
}

export interface RatesPaginatedResponse<T> {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: T[];
}

// ─── Vigencias ───────────────────────────────────────────────────────────────

/** `true` cuando la fila es la que rige hoy (no tiene fecha de cierre). */
export const isCurrentRate = (rate: { validTo?: string | null }): boolean =>
  !rate.validTo;

/** Etiqueta de la empresa de una tarifa. `null` es la tarifa pública. */
export const rateSupplierLabel = (rate: {
  supplierId?: string | null;
  supplierName?: string | null;
}): string => rate.supplierName ?? (rate.supplierId ? 'Empresa' : 'Tarifa pública');

// ─── Falta de tarifa ─────────────────────────────────────────────────────────

const MISSING_RATE_KEYS = new Set(['pricing.rate.notfound', 'pricing.doorrate.notfound']);

/**
 * `true` cuando el rechazo es "no hay tarifa cargada para esta ruta".
 *
 * No es un error del usuario ni un bug del front: es un dato que falta. La
 * pantalla tiene que decir eso y, si quien mira es superadmin, ofrecerle el link
 * al ABM de tarifas en vez de un mensaje de error genérico.
 */
export function isMissingRateError(err: unknown): boolean {
  return isApiError(err) && !!err.errorKey && MISSING_RATE_KEYS.has(err.errorKey);
}

export function getPricingErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const pricingService = {
  /**
   * Cotiza sin guardar nada. Roles: superadmin, admin, usuarioempresa.
   *
   * Puede fallar con `pricing.rate.notfound` / `pricing.doorrate.notfound`
   * (ver `isMissingRateError`).
   */
  quote: async (data: QuoteRequest): Promise<QuoteResponse> => {
    return apiClient<QuoteResponse>('/pricing/quote', { method: 'POST', data });
  },

  getShippingRates: async (
    page = 1,
    perPage = 10
  ): Promise<RatesPaginatedResponse<ShippingRate>> => {
    return apiClient<RatesPaginatedResponse<ShippingRate>>(
      `/shipping-rates?page=${page}&perPage=${perPage}`
    );
  },

  /**
   * Crea la SIGUIENTE vigencia. No hay PUT ni DELETE y es a propósito: una
   * tarifa no se edita, se sucede. El backend cierra sola la vigente de la
   * misma clave (empresa + ruta + expreso).
   */
  createShippingRate: async (data: CreateShippingRateRequest): Promise<ShippingRate> => {
    return apiClient<ShippingRate>('/shipping-rates', { method: 'POST', data });
  },

  getDoorServiceRates: async (
    page = 1,
    perPage = 10
  ): Promise<RatesPaginatedResponse<DoorServiceRate>> => {
    return apiClient<RatesPaginatedResponse<DoorServiceRate>>(
      `/door-service-rates?page=${page}&perPage=${perPage}`
    );
  },

  /** Append-only, igual que el flete: clave empresa + departamento + vehículo. */
  createDoorServiceRate: async (
    data: CreateDoorServiceRateRequest
  ): Promise<DoorServiceRate> => {
    return apiClient<DoorServiceRate>('/door-service-rates', { method: 'POST', data });
  },
};
