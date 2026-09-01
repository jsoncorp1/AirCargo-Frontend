import { apiClient } from './apiClient';

export type BolivianDepartment =
  | 'Beni'
  | 'Chuquisaca'
  | 'Cochabamba'
  | 'LaPaz'
  | 'Oruro'
  | 'Pando'
  | 'Potosi'
  | 'SantaCruz'
  | 'Tarija';

export const BOLIVIAN_DEPARTMENT_LABELS: Record<BolivianDepartment, string> = {
  Beni: 'Beni',
  Chuquisaca: 'Chuquisaca',
  Cochabamba: 'Cochabamba',
  LaPaz: 'La Paz',
  Oruro: 'Oruro',
  Pando: 'Pando',
  Potosi: 'Potosí',
  SantaCruz: 'Santa Cruz',
  Tarija: 'Tarija',
};

// ─── Tipo de empresa ─────────────────────────────────────────────────────────
//
//   WithCatalog → tiene artículos de inventario y crea órdenes de entrega.
//   PickupOnly  → sin catálogo: sus envíos se piden como solicitud de recojo.
export type SupplierKind = 'WithCatalog' | 'PickupOnly';

export const SUPPLIER_KIND_LABELS: Record<SupplierKind, string> = {
  WithCatalog: 'Con catálogo',
  PickupOnly: 'Solo recojos',
};

export const supplierKindLabel = (kind: SupplierKind | string): string =>
  SUPPLIER_KIND_LABELS[kind as SupplierKind] ?? kind;

export const SUPPLIER_KIND_OPTIONS: { value: SupplierKind; label: string }[] = [
  { value: 'WithCatalog', label: SUPPLIER_KIND_LABELS.WithCatalog },
  { value: 'PickupOnly', label: SUPPLIER_KIND_LABELS.PickupOnly },
];

/** El día de vencimiento va entre 1 y 28: ningún mes tiene menos de 28 días. */
export const MIN_PAYMENT_DUE_DAY = 1;
export const MAX_PAYMENT_DUE_DAY = 28;

export interface Supplier {
  id: string;
  name: string;
  description?: string;
  department?: BolivianDepartment;
  articleQuantity?: number;
  userQuantity?: number;

  // ─── Configuración (Fase 2) ────────────────────────────────────────────────

  kind?: SupplierKind;

  // Punto de recojo por defecto: precarga el alta de una solicitud de recojo.
  address?: string | null;
  locationUrl?: string | null;
  contactPhone?: string | null;

  // Horario de atención: precarga la ventana de recojo. Van los dos o ninguno.
  businessHoursStart?: string | null;
  businessHoursEnd?: string | null;

  /**
   * Habilita `OnAccount` para esta empresa. Quitarlo NO borra lo ya fiado:
   * impide fiar de ahí en adelante y los períodos abiertos se siguen cobrando.
   */
  hasCreditAccount?: boolean;
  /** Día del mes en que vence el período. Entre 1 y 28. */
  paymentDueDay?: number | null;
}

export interface SuppliersPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: Supplier[];
}

export interface CreateSupplierRequest {
  name: string;
  description?: string;
  department?: BolivianDepartment;
  kind?: SupplierKind;
  address?: string | null;
  locationUrl?: string | null;
  contactPhone?: string | null;
  /**
   * Van las DOS horas o ninguna (`supplier.businesshours.incomplete`), y start
   * antes que end (`supplier.businesshours.invalid`).
   */
  businessHoursStart?: string | null;
  businessHoursEnd?: string | null;
  hasCreditAccount?: boolean;
  /** Entre 1 y 28 (`supplier.paymentdueday.invalid`). */
  paymentDueDay?: number | null;
}

export type UpdateSupplierRequest = CreateSupplierRequest;

export interface SupplierListFilters {
  kind?: SupplierKind | '';
  hasCreditAccount?: boolean;
}

/**
 * `true` cuando el horario está a medias: una sola de las dos horas.
 *
 * El backend lo rechaza con `supplier.businesshours.incomplete`, así que
 * conviene anclarlo al campo antes de mandar.
 */
export const isBusinessHoursIncomplete = (
  start?: string | null,
  end?: string | null
): boolean => !!start !== !!end;

export const supplierService = {
  getSuppliers: async (
    page = 1,
    perPage = 10,
    filters: SupplierListFilters = {}
  ): Promise<SuppliersPaginatedResponse> => {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });
    if (filters.kind) query.append('kind', filters.kind);
    // `!== undefined` a propósito: `if (filters.hasCreditAccount)` se traga el
    // `false`, que es justamente el filtro "las que no tienen crédito".
    if (filters.hasCreditAccount !== undefined) {
      query.append('hasCreditAccount', String(filters.hasCreditAccount));
    }
    return apiClient<SuppliersPaginatedResponse>(`/suppliers?${query.toString()}`);
  },
  getSupplierById: async (id: string): Promise<Supplier> => {
    return apiClient<Supplier>(`/suppliers/${id}`);
  },
  createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
    return apiClient<Supplier>('/suppliers', {
      method: 'POST',
      data,
    });
  },
  updateSupplier: async (id: string, data: UpdateSupplierRequest): Promise<Supplier> => {
    return apiClient<Supplier>(`/suppliers/${id}`, {
      method: 'PUT',
      data,
    });
  },
  deleteSupplier: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};
