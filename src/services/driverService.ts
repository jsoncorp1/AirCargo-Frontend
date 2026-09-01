import { apiClient } from './apiClient';
import { getApiErrorMessage } from './apiErrorMessages';
import type { VehicleType } from './logisticsEnums';
import type { BadgeColor } from './shipmentService';

// Perfil del conductor: el vehículo con el que trabaja y bajo qué modalidad.
//
// Un usuario con rol `conductor` SIN perfil no puede recibir tareas: ni recojos
// ni repartos (`drivertask.driver.noprofile`). El perfil es 1-1 con el usuario y
// en la ruta del PUT va el id del USUARIO, no el del perfil.

// ─── Modalidad ───────────────────────────────────────────────────────────────
//
//   Fixed     → de planta. Siempre disponible; cobra sueldo mensual.
//   Sporadic  → por viaje. Solo disponible mientras esté "en línea"; sin sueldo.
export type DriverType = 'Fixed' | 'Sporadic';

export const DRIVER_TYPE_LABELS: Record<DriverType, string> = {
  Fixed: 'De planta',
  Sporadic: 'Esporádico',
};

export const driverTypeLabel = (value: DriverType | string): string =>
  DRIVER_TYPE_LABELS[value as DriverType] ?? value;

export const DRIVER_TYPE_OPTIONS: { value: DriverType; label: string }[] = [
  { value: 'Fixed', label: DRIVER_TYPE_LABELS.Fixed },
  { value: 'Sporadic', label: DRIVER_TYPE_LABELS.Sporadic },
];

export const driverTypeBadge = (value: DriverType | string): BadgeColor =>
  value === 'Fixed' ? 'primary' : 'info';

// ─── Reglas del formulario ───────────────────────────────────────────────────

/**
 * El sueldo mensual es OBLIGATORIO en un conductor de planta y está PROHIBIDO
 * en uno esporádico.
 *
 * No es una convención: hay un CHECK en la base de datos, así que mandarlo mal
 * no da un 400 con mensaje amable sino un rechazo duro. El formulario tiene que
 * mostrar u ocultar el campo según la modalidad y limpiarlo al cambiar.
 */
export const driverTypeRequiresSalary = (driverType: DriverType | string): boolean =>
  driverType === 'Fixed';

/**
 * `isOnline` solo tiene sentido en un esporádico: el de planta está siempre
 * disponible y su interruptor no significa nada.
 */
export const driverTypeUsesOnlineFlag = (driverType: DriverType | string): boolean =>
  driverType === 'Sporadic';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface Driver {
  driverUserId: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  branchOfficeId?: string | null;
  branchOfficeCode?: string | null;
  branchOfficeCity?: string | null;
  driverType: DriverType;
  vehicleType: VehicleType;
  // Única entre conductores activos.
  plateNumber: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor?: string | null;
  vehicleYear?: number | null;
  monthlySalary?: number | null;
  isOnline: boolean;
  lastOnlineAt?: string | null;
  /**
   * Ya calculado por el backend: un `Fixed` siempre lo está, un `Sporadic` solo
   * si está en línea. Es el campo con el que se arma el selector de asignación
   * — no recalcularlo acá.
   */
  isAvailable: boolean;
}

export interface DriversPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: Driver[];
}

export interface DriverListFilters {
  branchOfficeId?: string;
  driverType?: DriverType | '';
  vehicleType?: VehicleType | '';
  isOnline?: boolean;
  /** `true` → solo los que pueden recibir una tarea ahora mismo. */
  availableOnly?: boolean;
}

export interface CreateDriverRequest {
  driverUserId: string;
  driverType: DriverType;
  vehicleType: VehicleType;
  plateNumber: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor?: string | null;
  vehicleYear?: number | null;
  /** Obligatorio si `Fixed`, prohibido si `Sporadic`. */
  monthlySalary?: number | null;
}

export type UpdateDriverRequest = Omit<CreateDriverRequest, 'driverUserId'>;

export function getDriverErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const driverService = {
  getDrivers: async (
    page = 1,
    perPage = 10,
    filters: DriverListFilters = {}
  ): Promise<DriversPaginatedResponse> => {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });
    if (filters.branchOfficeId) query.append('branchOfficeId', filters.branchOfficeId);
    if (filters.driverType) query.append('driverType', filters.driverType);
    if (filters.vehicleType) query.append('vehicleType', filters.vehicleType);
    // `!== undefined` a propósito: `if (filters.isOnline)` se traga el `false`.
    if (filters.isOnline !== undefined) query.append('isOnline', String(filters.isOnline));
    if (filters.availableOnly) query.append('availableOnly', 'true');
    return apiClient<DriversPaginatedResponse>(`/drivers?${query.toString()}`);
  },

  /**
   * Los conductores que pueden recibir una tarea AHORA. Es la consulta que
   * alimenta los dos diálogos de asignación; para un recojo hay que pasarle
   * además el vehículo pedido, porque el backend valida que coincida
   * (`drivertask.vehicle.mismatch`).
   */
  getAvailableDrivers: async (vehicleType?: VehicleType): Promise<Driver[]> => {
    // Los conductores disponibles de una sucursal son pocos: una página alcanza
    // y evita paginar un selector.
    const res = await driverService.getDrivers(1, 100, {
      availableOnly: true,
      ...(vehicleType ? { vehicleType } : {}),
    });
    return res.data;
  },

  createDriver: async (data: CreateDriverRequest): Promise<Driver> => {
    return apiClient<Driver>('/drivers', { method: 'POST', data });
  },

  /** En la ruta va el id del USUARIO conductor, no el del perfil. */
  updateDriver: async (
    driverUserId: string,
    data: UpdateDriverRequest
  ): Promise<Driver> => {
    return apiClient<Driver>(`/drivers/${driverUserId}`, { method: 'PUT', data });
  },

  /**
   * Interruptor "en línea" del conductor esporádico. Solo rol `conductor`.
   *
   * Es un flag con marca de tiempo, no una conexión: no hay websockets ni
   * presencia en tiempo real. Se manda cuando el conductor lo toca, y nada más.
   */
  setOnline: async (isOnline: boolean): Promise<Driver> => {
    return apiClient<Driver>('/drivers/me/online', {
      method: 'PATCH',
      data: { isOnline },
    });
  },
};
