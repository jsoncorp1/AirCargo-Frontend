import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
import { BolivianDepartment } from './supplierService';
import type { BadgeColor } from './shipmentService';

// Clientes potenciales: lo que deja una empresa en el formulario público de
// contacto (`/contacto`) y que después se gestiona desde adentro.
//
// `POST /leads` es la ÚNICA ruta pública de escritura del sistema (la otra ruta
// sin JWT es `/auth/login`). Va protegida con rate limit por IP + honeypot.

// ─── Estados ─────────────────────────────────────────────────────────────────

//   New ──→ Contacted ──→ Won
//     │          └──→ Lost
//     └──→ Lost
export type LeadStatus = 'New' | 'Contacted' | 'Won' | 'Lost';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  New: 'Nuevo',
  Contacted: 'Contactado',
  Won: 'Cerrado (ganado)',
  Lost: 'Cerrado (perdido)',
};

export const LEAD_STATUS_BADGE: Record<LeadStatus, BadgeColor> = {
  New: 'warning',
  Contacted: 'primary',
  Won: 'success',
  Lost: 'error',
};

export const leadStatusLabel = (status: LeadStatus | string): string =>
  LEAD_STATUS_LABELS[status as LeadStatus] ?? status;

export const leadStatusBadge = (status: LeadStatus | string): BadgeColor =>
  LEAD_STATUS_BADGE[status as LeadStatus] ?? 'light';

// `Won` y `Lost` son terminales: un lead cerrado no se reabre. Cualquier otra
// transición devuelve `lead.statuschange.invalidtransition`.
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  New: ['Contacted', 'Lost'],
  Contacted: ['Won', 'Lost'],
  Won: [],
  Lost: [],
};

export const LEAD_STATUS_FILTER_OPTIONS: { value: LeadStatus; label: string }[] = (
  ['New', 'Contacted', 'Won', 'Lost'] as LeadStatus[]
).map((value) => ({ value, label: LEAD_STATUS_LABELS[value] }));

// ─── Límites ─────────────────────────────────────────────────────────────────

// Espejo de las validaciones del backend. Como el endpoint es público, el
// backend valida largos explícitamente para que un texto enorme no salga como
// error de Postgres (500); poniendo los mismos `maxLength` en los inputs esas
// claves `lead.*.toolong` no se ven nunca.
export const LEAD_MAX_LENGTHS = {
  companyName: 150,
  companyAddress: 200,
  country: 60,
  contactFullName: 150,
  contactEmail: 150,
  contactPhone: 30,
  comments: 200,
  internalNote: 500,
} as const;

// El listado admite hasta 500 por página; es lo que usa la exportación.
export const LEAD_MAX_PER_PAGE = 500;

export function getLeadErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface LeadListItem {
  id: string;
  companyName: string;
  city: BolivianDepartment;
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  status: LeadStatus;
  createdAt: string;
  // Se asigna solo: se lo queda el primer usuario que cambia el estado.
  assignedToUserId?: string | null;
  assignedToFullName?: string | null;
}

export interface LeadDetail extends LeadListItem {
  companyAddress: string;
  country: string;
  comments?: string | null;
  statusChangedAt?: string | null;
  internalNote?: string | null;
}

export interface LeadsPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: LeadListItem[];
}

export interface LeadListFilters {
  status?: LeadStatus | '';
  // Ignorado para un admin: el backend lo acota al departamento de su sucursal.
  city?: BolivianDepartment | '';
  // `yyyy-MM-dd`, ambos extremos inclusive.
  dateFrom?: string;
  dateTo?: string;
  // Implementado server-side sobre la tabla entera (compañía, contacto, correo).
  searchTerm?: string;
}

export interface CreateLeadRequest {
  companyName: string;
  companyAddress: string;
  city: BolivianDepartment;
  // Opcional; el backend usa "Bolivia" si no viene.
  country?: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  comments?: string;
  // Honeypot: SIEMPRE vacío. Si llega con algo, el backend responde 201 y
  // descarta el lead en silencio (un 400 le enseñaría al bot cuál es el campo).
  website: string;
}

export interface CreateLeadResponse {
  id: string;
  companyName: string;
  status: LeadStatus;
  createdAt: string;
}

export interface ChangeLeadStatusRequest {
  status: LeadStatus;
  // Si se omite se CONSERVA la anterior; no se borra por omisión.
  internalNote?: string;
}

export interface ChangeLeadStatusResponse {
  id: string;
  status: LeadStatus;
  statusChangedAt: string;
  assignedToUserId?: string | null;
  assignedToFullName?: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const leadService = {
  // Público: lo llama el formulario de contacto sin sesión iniciada.
  createLead: async (data: CreateLeadRequest): Promise<CreateLeadResponse> => {
    return apiClient<CreateLeadResponse>('/leads', { method: 'POST', data });
  },

  getLeads: async (
    page = 1,
    perPage = 10,
    filters: LeadListFilters = {}
  ): Promise<LeadsPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: Math.min(perPage, LEAD_MAX_PER_PAGE).toString(),
    });
    if (filters.status) query.append('status', filters.status);
    if (filters.city) query.append('city', filters.city);
    if (filters.dateFrom) query.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.append('dateTo', filters.dateTo);
    if (filters.searchTerm) query.append('searchTerm', filters.searchTerm);
    return apiClient<LeadsPaginatedResponse>(`/leads?${query.toString()}`);
  },

  getLeadById: async (id: string): Promise<LeadDetail> => {
    return apiClient<LeadDetail>(`/leads/${id}`);
  },

  changeLeadStatus: async (
    id: string,
    data: ChangeLeadStatusRequest
  ): Promise<ChangeLeadStatusResponse> => {
    return apiClient<ChangeLeadStatusResponse>(`/leads/${id}/status`, {
      method: 'PATCH',
      data,
    });
  },
};
