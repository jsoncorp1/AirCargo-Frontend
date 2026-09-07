import { apiClient } from './apiClient';
import type { PaymentMethod } from './logisticsEnums';

/**
 * La caja de la sucursal: un solo cajón.
 *
 * Lo que antes eran dos módulos —"caja chica" (gastos) y "turno de caja"
 * (cobros)— es un único libro. En la sucursal siempre fue la misma gaveta: la
 * misma de la que se dan vueltos, en la que entra lo que paga el cliente, y de
 * la que se saca para el taxi. `petty-cash` ya no existe en el backend y sus
 * rutas devuelven 404.
 *
 * Ver `src/doc/caja-unificada-lo-que-hizo-el-back.md`.
 */

// ─── Arqueo Diario (por usuario) ─────────────────────────────────────────────
//
// OJO: esto NO es el arqueo del cajón. Responde "cuánto cobró fulano hoy", que
// es una consulta por persona. El arqueo del cajón es de la sucursal entera y
// va por `sessions`.

export interface DailyCashShipmentItem {
  id: string;
  code: string;
  waybillNumber: string;
  clientFullName: string;
  paymentMethod: PaymentMethod;
  amount: number;
  collectedAt: string;
}

export interface DailyCashCountResponse {
  date: string;
  userId: string;
  collectedBy: string;
  collectedByName: string;

  cash: number;     // Efectivo en cajón a contar
  qr: number;       // Cobrado por QR (entró al banco, NO está en cajón)
  total: number;

  shipmentCount: number;
  shipments: DailyCashShipmentItem[];
}

export interface DailyCashCountParams {
  date?: string;   // yyyy-MM-dd en calendario boliviano
  userId?: string; // Solo permitido para rol superadmin
}

// ─── La caja ─────────────────────────────────────────────────────────────────

export type CashRegisterSessionStatus = 'Open' | 'Closed';

/**
 * Las dos únicas direcciones de un movimiento manual.
 *
 * No hay un tipo "depósito": la plata que se le manda al jefe —en la mano o
 * depositada en el cajero— **es un egreso**. Lo único que cambia es la
 * descripción.
 */
export type CashMovementKind = 'Income' | 'Expense';

export const CASH_MOVEMENT_KIND_LABELS: Record<CashMovementKind, string> = {
  Income: 'Ingreso',
  Expense: 'Egreso',
};

export interface CashRegisterUserBreakdown {
  userId: string;
  collectedBy: string;
  collectedByName: string;
  cash: number;
  qr: number;
  shipmentCount: number;
}

export interface CashRegisterShipmentItem {
  id?: string;
  code: string;
  waybillNumber: string;
  clientFullName: string;
  paymentMethod: PaymentMethod;
  amount: number;
  collectedBy?: string;
  collectedAt: string;
}

export interface CashMovement {
  id: string;
  kind: CashMovementKind;
  amount: number;
  // El monto con el signo ya puesto por el `kind`: el back lo manda resuelto
  // para que la tabla no tenga que decidirlo por fila.
  signedAmount: number;
  /**
   * El saldo del cajón en el instante de esta fila: arranca en `openingCash` y
   * arrastra también los cobros en efectivo anteriores al movimiento.
   *
   * Por eso la última fila puede quedar **por debajo** de `balance` — si después
   * del último movimiento entraron cobros, esa plata entró después. No es un
   * error de cuadre.
   */
  runningBalance: number;
  description: string;
  receiptUrl: string | null;
  // Solo en rendiciones de contraentrega: a qué conductor corresponde el ingreso.
  settledByDriverId: string | null;
  settledByDriver: string | null;
  settledByDriverName: string | null;
  registeredByUserId: string;
  registeredBy: string;
  registeredByName: string;
  createdAt: string;
  day: string;
  // `true` solo si la fila la registró quien está mirando Y la caja sigue abierta.
  canEdit: boolean;
}

export interface CashRegisterSession {
  id: string;
  branchOfficeId: string;
  branchOfficeCode: string;
  branchOfficeCity: string;
  status: CashRegisterSessionStatus;

  // Apertura. `carriedCash` es lo que dejó contado el cierre anterior;
  // `openingCash` es lo que se contó de verdad al abrir. Cuando difieren, la
  // diferencia es un hallazgo entre turnos y `openingNotes` es obligatoria.
  carriedCash: number;
  openingCash: number;
  openingDifference: number;
  openingNotes: string | null;

  // Las tres partes que arman el saldo, ya sumadas por el back.
  collectedCash: number;
  movementsIncome: number;
  movementsExpense: number;
  // El número que se cuenta contra el cajón. No acumular las partes acá.
  balance: number;

  // Cobrado por QR: va al banco del jefe, NO está en el cajón y no entra en
  // `balance`. Se muestra aparte y se reporta en `qr-summary`.
  expectedQr: number;

  // Nulos mientras la caja esté abierta.
  countedCash: number | null;
  difference: number | null;
  closingNotes: string | null;

  openedAt: string;
  openedDay: string;
  openedBy: string;
  closedAt: string | null;
  closedDay: string | null;
  closedBy: string | null;

  shipmentCount: number;
  movementCount: number;

  byUser: CashRegisterUserBreakdown[];
  movements: CashMovement[];
  shipments: CashRegisterShipmentItem[];
}

/** Lo que arrastra la sucursal del cierre anterior, para precargar la apertura. */
export interface CarriedCashResponse {
  branchOfficeId: string;
  branchOfficeCode: string;
  carriedCash: number;
  lastSessionId: string | null;
  lastClosedAt: string | null;
  lastClosedDay: string | null;
  lastClosedBy: string | null;
  // `true` → ya hay caja abierta: hay que ir al arqueo, no a la apertura.
  hasOpenSession: boolean;
}

export interface CashRegisterSessionListItem {
  id: string;
  branchOfficeId: string;
  branchOfficeCode: string;
  status: CashRegisterSessionStatus;

  carriedCash: number;
  openingCash: number;
  openingDifference: number;
  openingNotes: string | null;

  movementsIncome: number;
  movementsExpense: number;
  movementCount: number;

  // `null` mientras la caja siga abierta: dependen de recalcular los cobros.
  balance: number | null;
  expectedQr: number | null;

  countedCash: number | null;
  difference: number | null;
  closingNotes: string | null;

  openedAt: string;
  openedDay: string;
  openedBy: string;
  closedAt: string | null;
  closedDay: string | null;
  closedBy: string | null;
}

export interface CashRegisterSessionPaginatedResponse {
  data: CashRegisterSessionListItem[];
  currentPage: number;
  totalPages: number;
  count: number;
}

export interface CashRegisterSessionListFilters {
  branchOfficeId?: string;
  status?: CashRegisterSessionStatus | '';
  dateFrom?: string;
  dateTo?: string;
}

export interface OpenCashRegisterSessionRequest {
  // Lo contado al abrir. `0` es válido (una sucursal que arranca sin sencillo);
  // lo que no se acepta es un negativo.
  openingCash: number;
  // Obligatoria si `openingCash` difiere de lo arrastrado.
  openingNotes?: string | null;
}

export interface CloseCashRegisterSessionRequest {
  countedCash: number;
  // Obligatoria si la diferencia contra `balance` no es cero.
  closingNotes?: string | null;
}

export interface CashMovementRequest {
  kind: CashMovementKind;
  amount: number;
  description: string;
  // Solo en rendiciones: tiene que ser un usuario con rol conductor.
  settledByDriverId?: string | null;
}

// ─── Reporte de QR ───────────────────────────────────────────────────────────

export type QrSummaryGroupBy = 'Day' | 'Month';

export interface QrSummaryRow {
  // `2026-09-05` con `Day`; `2026-09` con `Month`. Siempre día boliviano.
  period: string;
  branchOfficeId: string;
  branchOfficeCode: string;
  totalQr: number;
  shipmentCount: number;
}

export interface QrSummaryResponse {
  groupBy: QrSummaryGroupBy;
  dateFrom: string;
  dateTo: string;
  data: QrSummaryRow[];
  total: number;
  shipmentCount: number;
}

export interface QrSummaryFilters {
  groupBy?: QrSummaryGroupBy;
  dateFrom?: string;
  dateTo?: string;
  // Solo lo usa el superadmin; a un admin se le ignora y ve su sucursal.
  branchOfficeId?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const cashRegisterService = {
  /** "Cuánto cobró fulano hoy". No es el arqueo del cajón. */
  getDailyCount: async (params: DailyCashCountParams = {}): Promise<DailyCashCountResponse> => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.userId) query.append('userId', params.userId);
    const queryString = query.toString();
    return apiClient<DailyCashCountResponse>(
      `/cash-register/daily${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Cuánto arrastra la sucursal del cierre anterior.
   *
   * Existe aparte de `getCurrentSession` porque la apertura ocurre justamente
   * cuando no hay caja abierta, y ahí `current` responde 404.
   */
  getCarriedCash: async (): Promise<CarriedCashResponse> => {
    return apiClient<CarriedCashResponse>('/cash-register/sessions/carried');
  },

  /**
   * La caja abierta de la sucursal, con todo armado para la pantalla.
   * Devuelve `null` cuando no hay ninguna abierta, que es un estado normal
   * (la sucursal todavía no abrió) y no un error.
   */
  getCurrentSession: async (): Promise<CashRegisterSession | null> => {
    try {
      return await apiClient<CashRegisterSession>('/cash-register/sessions/current');
    } catch (error) {
      if ((error as { status?: number })?.status === 404) return null;
      throw error;
    }
  },

  getSessionById: async (id: string): Promise<CashRegisterSession> => {
    return apiClient<CashRegisterSession>(`/cash-register/sessions/${id}`);
  },

  getSessions: async (
    page = 1,
    perPage = 10,
    filters: CashRegisterSessionListFilters = {}
  ): Promise<CashRegisterSessionPaginatedResponse> => {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });
    if (filters.branchOfficeId) query.append('branchOfficeId', filters.branchOfficeId);
    if (filters.status) query.append('status', filters.status);
    if (filters.dateFrom) query.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.append('dateTo', filters.dateTo);
    return apiClient<CashRegisterSessionPaginatedResponse>(
      `/cash-register/sessions?${query.toString()}`
    );
  },

  openSession: async (data: OpenCashRegisterSessionRequest): Promise<CashRegisterSession> => {
    return apiClient<CashRegisterSession>('/cash-register/sessions', {
      method: 'POST',
      data,
    });
  },

  /** Cerrar es irreversible: no hay reabrir, ni para el superadmin. */
  closeSession: async (
    id: string,
    data: CloseCashRegisterSessionRequest
  ): Promise<CashRegisterSession> => {
    return apiClient<CashRegisterSession>(`/cash-register/sessions/${id}/close`, {
      method: 'POST',
      data,
    });
  },

  // ─── Movimientos ───────────────────────────────────────────────────────────
  //
  // La sucursal no viaja en el body: sale del usuario autenticado, y el
  // movimiento entra a la caja abierta de esa sucursal. Sin caja abierta, el
  // backend responde `cashregister.session.notopen`.

  createMovement: async (
    data: CashMovementRequest
  ): Promise<CashMovement & { cashRegisterSessionId: string; balance: number }> => {
    return apiClient<CashMovement & { cashRegisterSessionId: string; balance: number }>(
      '/cash-register/movements',
      { method: 'POST', data }
    );
  },

  updateMovement: async (
    id: string,
    data: CashMovementRequest
  ): Promise<CashMovement & { balance: number }> => {
    return apiClient<CashMovement & { balance: number }>(`/cash-register/movements/${id}`, {
      method: 'PUT',
      data,
    });
  },

  deleteMovement: async (id: string): Promise<{ id: string; balance: number }> => {
    return apiClient<{ id: string; balance: number }>(`/cash-register/movements/${id}`, {
      method: 'DELETE',
    });
  },

  /** JPG/PNG/WEBP hasta 10 MB. Reemplaza el comprobante anterior. */
  uploadReceipt: async (movementId: string, file: File): Promise<{ receiptUrl: string }> => {
    const formData = new FormData();
    formData.append('receipt', file);
    return apiClient<{ receiptUrl: string }>(`/cash-register/movements/${movementId}/receipt`, {
      method: 'POST',
      data: formData,
    });
  },

  /**
   * Total cobrado por QR, agrupado por día o por mes boliviano.
   *
   * Sin rango, el backend devuelve el mes boliviano en curso. El QR no está en
   * el cajón —va directo al banco— así que este total no se cuenta contra
   * ningún billete: es para el contador.
   */
  getQrSummary: async (filters: QrSummaryFilters = {}): Promise<QrSummaryResponse> => {
    const query = new URLSearchParams();
    if (filters.groupBy) query.append('groupBy', filters.groupBy);
    if (filters.dateFrom) query.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.append('dateTo', filters.dateTo);
    if (filters.branchOfficeId) query.append('branchOfficeId', filters.branchOfficeId);
    const queryString = query.toString();
    return apiClient<QrSummaryResponse>(
      `/cash-register/qr-summary${queryString ? `?${queryString}` : ''}`
    );
  },
};
