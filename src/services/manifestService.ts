import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
import type { BadgeColor, ShipmentStatus } from './shipmentService';

// Un manifiesto es el lote de transporte entre dos sucursales: agrupa los envíos
// que salen juntos en un mismo viaje. Es el que arrastra el estado de todos sus
// envíos de una sola vez, con `changeStatus`.
//
// Roles: superadmin y admin. El admin solo opera sobre manifiestos que salen de
// su sucursal (o que llegan a ella, para recibir); ese recorte es server-side.

// ─── Estados ─────────────────────────────────────────────────────────────────

//   Open ──→ InTransit ──→ Received
//     └──→ Cancelled
export type ManifestStatus = 'Open' | 'InTransit' | 'Received' | 'Cancelled';

export const MANIFEST_STATUS_LABELS: Record<ManifestStatus, string> = {
  Open: 'Abierto',
  InTransit: 'Despachado',
  Received: 'Recibido',
  Cancelled: 'Anulado',
};

export const MANIFEST_STATUS_BADGE: Record<ManifestStatus, BadgeColor> = {
  Open: 'warning',
  InTransit: 'info',
  Received: 'success',
  Cancelled: 'dark',
};

export const manifestStatusLabel = (status: ManifestStatus | string): string =>
  MANIFEST_STATUS_LABELS[status as ManifestStatus] ?? status;

export const manifestStatusBadge = (status: ManifestStatus | string): BadgeColor =>
  MANIFEST_STATUS_BADGE[status as ManifestStatus] ?? 'light';

// Efecto de cada cambio de estado del manifiesto sobre TODOS sus envíos. Espejo
// de `ManifestStatusRules.ShipmentStatusFor` del backend; sirve para avisar en la
// UI qué va a pasar antes de confirmar.
export const MANIFEST_CASCADE: Record<ManifestStatus, ShipmentStatus | null> = {
  Open: null,
  InTransit: 'InTransit',
  Received: 'AtDestinationBranch',
  Cancelled: 'AtOriginBranch',
};

// `Open` admite agregar y quitar envíos; el resto está cerrado.
export const isManifestEditable = (status: ManifestStatus | string): boolean =>
  status === 'Open';

/**
 * Cambios de estado que este usuario puede hacer sobre este manifiesto.
 *
 * No es solo cuestión de la transición: cada punta del viaje la opera una
 * sucursal distinta. Despachar y anular son de la sucursal de ORIGEN; recibir es
 * de la de DESTINO. El superadmin, al ser global, opera las dos puntas.
 *
 * Es un espejo de `ManifestAccess` del backend, para no ofrecer botones que van
 * a rebotar con `manifest.access.forbidden`.
 */
export function availableManifestTransitions(
  manifest: Pick<Manifest, 'status' | 'originBranchOfficeId' | 'destinationBranchOfficeId'>,
  user: { isSuperAdmin: boolean; branchOfficeId?: string | null }
): ManifestStatus[] {
  const atOrigin = user.isSuperAdmin || user.branchOfficeId === manifest.originBranchOfficeId;
  const atDestination =
    user.isSuperAdmin || user.branchOfficeId === manifest.destinationBranchOfficeId;

  switch (manifest.status) {
    case 'Open':
      return atOrigin ? ['InTransit', 'Cancelled'] : [];
    case 'InTransit':
      return atDestination ? ['Received'] : [];
    default:
      return [];
  }
}

export function getManifestErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

// Cabecera, tal como la devuelven POST /manifests y el listado.
export interface Manifest {
  id: string;
  code: string;
  originBranchOfficeId: string;
  originBranchOfficeCode: string;
  destinationBranchOfficeId: string;
  destinationBranchOfficeCode: string;
  status: ManifestStatus;
  transportReference?: string | null;
  createdAt: string;
  departureAt?: string | null;
  receivedAt?: string | null;
  // Totales calculados al leer (el backend no guarda contadores).
  shipmentCount?: number;
  totalWeight?: number;
  totalPackageCount?: number;
}

// Envío dentro de un manifiesto, como viene en GET /manifests/{id}.
export interface ManifestShipment {
  id: string;
  code: string;
  waybillNumber?: string | null;
  status: ShipmentStatus;
  clientFullName: string;
  clientAddress: string;
  totalWeight: number;
  packageCount: number;
  packageDescription?: string | null;
}

export interface ManifestDetail extends Manifest {
  shipments: ManifestShipment[];
  shipmentCount: number;
  totalWeight: number;
  totalPackageCount: number;
}

export interface ManifestsPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: Manifest[];
}

export interface ManifestListFilters {
  originBranchOfficeId?: string;
  destinationBranchOfficeId?: string;
  status?: ManifestStatus | '';
  // Formato `yyyy-MM-dd`, ambos extremos inclusive.
  dateFrom?: string;
  dateTo?: string;
}

// `originBranchOfficeId` lo manda SOLO el superadmin (es global y no tiene
// sucursal propia). Si lo manda un admin se ignora y se usa la suya, así que el
// front puede mandarlo siempre sin lógica condicional.
export interface CreateManifestRequest {
  originBranchOfficeId?: string | null;
  destinationBranchOfficeId: string;
}

// Todo-o-nada: si un solo envío del lote no cumple, la llamada se rechaza entera
// y el manifiesto queda como estaba. Un envío entra solo si está en
// `AtOriginBranch`, no está ya en otro manifiesto, y hace exactamente el mismo
// trayecto que el manifiesto.
export interface AddShipmentsToManifestRequest {
  shipmentIds: string[];
}

export interface AddedManifestShipment {
  id: string;
  code: string;
  status: ShipmentStatus;
  totalWeight: number;
  packageCount: number;
}

export interface AddShipmentsToManifestResponse {
  manifestId: string;
  code: string;
  // Total del manifiesto, no solo los recién agregados.
  shipmentCount: number;
  totalWeight: number;
  addedShipments: AddedManifestShipment[];
}

export interface RemoveShipmentFromManifestResponse {
  manifestId: string;
  shipmentId: string;
  shipmentCode: string;
  shipmentStatus: ShipmentStatus;
  shipmentCount: number;
}

// `transportReference` solo se toma al despachar (`InTransit`).
export interface ChangeManifestStatusRequest {
  status: ManifestStatus;
  transportReference?: string;
}

export interface ChangeManifestStatusResponse {
  id: string;
  code: string;
  status: ManifestStatus;
  transportReference?: string | null;
  departureAt?: string | null;
  receivedAt?: string | null;
  shipmentCount: number;
  shipments: { id: string; code: string; status: ShipmentStatus }[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const manifestService = {
  getManifests: async (
    page = 1,
    perPage = 10,
    filters: ManifestListFilters = {}
  ): Promise<ManifestsPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
    if (filters.originBranchOfficeId) query.append('originBranchOfficeId', filters.originBranchOfficeId);
    if (filters.destinationBranchOfficeId) query.append('destinationBranchOfficeId', filters.destinationBranchOfficeId);
    if (filters.status) query.append('status', filters.status);
    if (filters.dateFrom) query.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.append('dateTo', filters.dateTo);
    return apiClient<ManifestsPaginatedResponse>(`/manifests?${query.toString()}`);
  },

  getManifestById: async (id: string): Promise<ManifestDetail> => {
    return apiClient<ManifestDetail>(`/manifests/${id}`);
  },

  // El manifiesto nace vacío; los envíos se agregan con `addShipments`.
  createManifest: async (data: CreateManifestRequest): Promise<Manifest> => {
    return apiClient<Manifest>('/manifests', { method: 'POST', data });
  },

  addShipments: async (
    id: string,
    data: AddShipmentsToManifestRequest
  ): Promise<AddShipmentsToManifestResponse> => {
    return apiClient<AddShipmentsToManifestResponse>(`/manifests/${id}/shipments`, {
      method: 'POST',
      data,
    });
  },

  // Saca un envío del lote; vuelve a `AtOriginBranch`. Solo con el manifiesto en `Open`.
  removeShipment: async (
    id: string,
    shipmentId: string
  ): Promise<RemoveShipmentFromManifestResponse> => {
    return apiClient<RemoveShipmentFromManifestResponse>(
      `/manifests/${id}/shipments/${shipmentId}`,
      { method: 'DELETE' }
    );
  },

  // Mueve todos los envíos del lote de una sola vez (ver MANIFEST_CASCADE).
  changeStatus: async (
    id: string,
    data: ChangeManifestStatusRequest
  ): Promise<ChangeManifestStatusResponse> => {
    return apiClient<ChangeManifestStatusResponse>(`/manifests/${id}/status`, {
      method: 'PATCH',
      data,
    });
  },

  // Solo si está en `Open`. Un lote que ya salió no se borra: para deshacerlo
  // antes de salir está el estado `Cancelled`.
  deleteManifest: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/manifests/${id}`, { method: 'DELETE' });
  },
};
