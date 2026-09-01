import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
import type { BadgeColor } from './shipmentService';

// Cuenta corriente de la empresa: el período mensual donde se acumulan los
// envíos que se fiaron (`paymentType: 'OnAccount'`).
//
// Las líneas ENTRAN SOLAS al crear el envío, nazca por donde nazca —recepción de
// un recojo, orden corporativa o esporádico—. No hay endpoint para agregar o
// quitar una a mano, y no debe haberlo en la UI.

// ─── Estados ─────────────────────────────────────────────────────────────────

//   Open ──▶ Closed ──▶ Settled
//              └──▶ Overdue (se CALCULA al leer: cerrado y vencido)
export type BillingPeriodStatus = 'Open' | 'Closed' | 'Settled' | 'Overdue';

export const BILLING_PERIOD_STATUS_LABELS: Record<BillingPeriodStatus, string> = {
  Open: 'Abierto',
  Closed: 'Cerrado',
  Settled: 'Cobrado',
  Overdue: 'Vencido',
};

export const BILLING_PERIOD_STATUS_BADGE: Record<BillingPeriodStatus, BadgeColor> = {
  Open: 'light',
  Closed: 'warning',
  Settled: 'success',
  Overdue: 'error',
};

export const billingPeriodStatusLabel = (status: BillingPeriodStatus | string): string =>
  BILLING_PERIOD_STATUS_LABELS[status as BillingPeriodStatus] ?? status;

export const billingPeriodStatusBadge = (
  status: BillingPeriodStatus | string
): BadgeColor => BILLING_PERIOD_STATUS_BADGE[status as BillingPeriodStatus] ?? 'light';

export const BILLING_PERIOD_STATUS_OPTIONS: {
  value: BillingPeriodStatus;
  label: string;
}[] = (['Open', 'Closed', 'Overdue', 'Settled'] as BillingPeriodStatus[]).map((value) => ({
  value,
  label: BILLING_PERIOD_STATUS_LABELS[value],
}));

// ─── Reglas de la pantalla ───────────────────────────────────────────────────

/**
 * Un período NO se cierra hasta el primer día del mes siguiente
 * (`billing.period.stillopen`).
 *
 * El botón de cerrar tiene que estar deshabilitado con esa explicación, no
 * fallar al apretarlo.
 */
export function canClosePeriod(period: Pick<BillingPeriod, 'status' | 'year' | 'month'>): boolean {
  if (period.status !== 'Open') return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return period.year < currentYear || (period.year === currentYear && period.month < currentMonth);
}

export const canSettlePeriod = (status: BillingPeriodStatus | string): boolean =>
  status === 'Closed' || status === 'Overdue';

/**
 * Semáforo del vencimiento a partir de `daysUntilDue`, que ya viene calculado.
 * No comparar fechas acá: `Overdue` lo resuelve el backend al leer.
 */
export function dueDateTone(daysUntilDue?: number | null): BadgeColor {
  if (daysUntilDue === undefined || daysUntilDue === null) return 'light';
  if (daysUntilDue < 0) return 'error';
  if (daysUntilDue <= 3) return 'warning';
  return 'success';
}

export function dueDateLabel(daysUntilDue?: number | null): string {
  if (daysUntilDue === undefined || daysUntilDue === null) return '—';
  if (daysUntilDue < 0) {
    const days = Math.abs(daysUntilDue);
    return `Vencido hace ${days} día${days === 1 ? '' : 's'}`;
  }
  if (daysUntilDue === 0) return 'Vence hoy';
  return `Vence en ${daysUntilDue} día${daysUntilDue === 1 ? '' : 's'}`;
}

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** `agosto 2026`. El período es un mes calendario, no un rango arbitrario. */
export const periodLabel = (year: number, month: number): string =>
  `${MONTH_NAMES[month - 1] ?? month} ${year}`;

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface BillingEntry {
  id: string;
  shipmentId: string;
  shipmentCode: string;
  shipmentDate: string;
  amount: number;
}

export interface BillingPeriod {
  id: string;
  supplierId: string;
  supplierName: string;
  year: number;
  month: number;
  status: BillingPeriodStatus;
  totalAmount: number;
  entryCount: number;
  closedAt?: string | null;
  dueDate?: string | null;
  settledAt?: string | null;
  settlementReference?: string | null;
  /** Negativo si ya venció. Es el campo del semáforo. */
  daysUntilDue?: number | null;
}

export interface BillingPeriodDetail extends BillingPeriod {
  entries: BillingEntry[];
}

export interface BillingPeriodsPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: BillingPeriod[];
}

export interface BillingPeriodListFilters {
  /** Se ignora para el `usuarioempresa`: el backend le fuerza la suya. */
  supplierId?: string;
  year?: number;
  month?: number;
  status?: BillingPeriodStatus | '';
}

export interface SettlePeriodRequest {
  settlementReference?: string | null;
}

export function getBillingErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const billingService = {
  getPeriods: async (
    page = 1,
    perPage = 10,
    filters: BillingPeriodListFilters = {}
  ): Promise<BillingPeriodsPaginatedResponse> => {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });
    if (filters.supplierId) query.append('supplierId', filters.supplierId);
    if (filters.year !== undefined) query.append('year', String(filters.year));
    if (filters.month !== undefined) query.append('month', String(filters.month));
    if (filters.status) query.append('status', filters.status);
    return apiClient<BillingPeriodsPaginatedResponse>(
      `/billing-periods?${query.toString()}`
    );
  },

  getPeriodById: async (id: string): Promise<BillingPeriodDetail> => {
    return apiClient<BillingPeriodDetail>(`/billing-periods/${id}`);
  },

  /** Cierra y CONGELA el total. Solo a partir del primer día del mes siguiente. */
  closePeriod: async (id: string): Promise<BillingPeriod> => {
    return apiClient<BillingPeriod>(`/billing-periods/${id}/close`, { method: 'POST' });
  },

  /** Registra el cobro. La referencia es el dato con el que se concilia después. */
  settlePeriod: async (
    id: string,
    data: SettlePeriodRequest = {}
  ): Promise<BillingPeriod> => {
    return apiClient<BillingPeriod>(`/billing-periods/${id}/settle`, {
      method: 'POST',
      data,
    });
  },
};
