import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
import type { BadgeColor } from './shipmentService';
import type { DriverType } from './driverService';
import type { VehicleType } from './logisticsEnums';
import type { DriverTaskKind } from './driverTaskService';

// Liquidación al conductor: el espejo de la cuenta corriente, del otro lado del
// mostrador. Acumula por mes lo que la empresa le debe al conductor por sus
// tareas cerradas.
//
// El conductor ve la SUYA y nada más: es su recibo del mes.

// ─── Estados ─────────────────────────────────────────────────────────────────

//   Open ──▶ Closed ──▶ Paid
export type DriverSettlementStatus = 'Open' | 'Closed' | 'Paid';

export const DRIVER_SETTLEMENT_STATUS_LABELS: Record<DriverSettlementStatus, string> = {
  Open: 'Abierta',
  Closed: 'Cerrada',
  Paid: 'Pagada',
};

export const DRIVER_SETTLEMENT_STATUS_BADGE: Record<DriverSettlementStatus, BadgeColor> = {
  Open: 'light',
  Closed: 'warning',
  Paid: 'success',
};

export const driverSettlementStatusLabel = (
  status: DriverSettlementStatus | string
): string => DRIVER_SETTLEMENT_STATUS_LABELS[status as DriverSettlementStatus] ?? status;

export const driverSettlementStatusBadge = (
  status: DriverSettlementStatus | string
): BadgeColor => DRIVER_SETTLEMENT_STATUS_BADGE[status as DriverSettlementStatus] ?? 'light';

export const DRIVER_SETTLEMENT_STATUS_OPTIONS: {
  value: DriverSettlementStatus;
  label: string;
}[] = (['Open', 'Closed', 'Paid'] as DriverSettlementStatus[]).map((value) => ({
  value,
  label: DRIVER_SETTLEMENT_STATUS_LABELS[value],
}));

export const canCloseSettlement = (status: DriverSettlementStatus | string): boolean =>
  status === 'Open';

export const canPaySettlement = (status: DriverSettlementStatus | string): boolean =>
  status === 'Closed';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface DriverSettlement {
  id: string;
  driverUserId: string;
  driverFullName: string;
  branchOfficeId?: string | null;
  branchOfficeCode?: string | null;
  year: number;
  month: number;
  status: DriverSettlementStatus;
  totalAmount: number;
  taskCount: number;
  closedAt?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
}

export interface DriverSettlementsPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: DriverSettlement[];
}

export interface DriverSettlementListFilters {
  /** Se ignora para el rol `conductor`: el backend le fuerza la suya. */
  driverUserId?: string;
  year?: number;
  month?: number;
  status?: DriverSettlementStatus | '';
}

export interface PaySettlementRequest {
  paymentReference?: string | null;
}

// ─── Tarifario de comisiones ─────────────────────────────────────────────────
//
// Append-only, igual que las tarifas de flete: no se edita una vigencia, se
// carga la siguiente.
//
//   comisión = fixedAmount + cargoDePuerta × percentOfDoorCharge / 100
//
// Hace falta una fila por tipo de conductor × vehículo × tipo de tarea. Sin
// esto un esporádico liquida en CERO.

export interface DriverCommissionRate {
  id: string;
  driverType: DriverType;
  vehicleType: VehicleType;
  taskKind: DriverTaskKind;
  fixedAmount: number;
  percentOfDoorCharge: number;
  validFrom: string;
  /** `null` = es la vigencia que rige hoy. */
  validTo?: string | null;
}

export interface CreateDriverCommissionRateRequest {
  driverType: DriverType;
  vehicleType: VehicleType;
  taskKind: DriverTaskKind;
  fixedAmount: number;
  percentOfDoorCharge: number;
  validFrom?: string | null;
}

export interface DriverCommissionRatesPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: DriverCommissionRate[];
}

export function getSettlementErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const driverSettlementService = {
  getSettlements: async (
    page = 1,
    perPage = 10,
    filters: DriverSettlementListFilters = {}
  ): Promise<DriverSettlementsPaginatedResponse> => {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });
    if (filters.driverUserId) query.append('driverUserId', filters.driverUserId);
    if (filters.year !== undefined) query.append('year', String(filters.year));
    if (filters.month !== undefined) query.append('month', String(filters.month));
    if (filters.status) query.append('status', filters.status);
    return apiClient<DriverSettlementsPaginatedResponse>(
      `/driver-settlements?${query.toString()}`
    );
  },

  closeSettlement: async (id: string): Promise<DriverSettlement> => {
    return apiClient<DriverSettlement>(`/driver-settlements/${id}/close`, {
      method: 'POST',
    });
  },

  paySettlement: async (
    id: string,
    data: PaySettlementRequest = {}
  ): Promise<DriverSettlement> => {
    return apiClient<DriverSettlement>(`/driver-settlements/${id}/pay`, {
      method: 'POST',
      data,
    });
  },

  // Solo superadmin.
  getCommissionRates: async (
    page = 1,
    perPage = 10
  ): Promise<DriverCommissionRatesPaginatedResponse> => {
    return apiClient<DriverCommissionRatesPaginatedResponse>(
      `/driver-commission-rates?page=${page}&perPage=${perPage}`
    );
  },

  createCommissionRate: async (
    data: CreateDriverCommissionRateRequest
  ): Promise<DriverCommissionRate> => {
    return apiClient<DriverCommissionRate>('/driver-commission-rates', {
      method: 'POST',
      data,
    });
  },
};
