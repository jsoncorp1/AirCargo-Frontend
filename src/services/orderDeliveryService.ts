import { apiClient } from './apiClient';
import type { BolivianDepartment } from './supplierService';
import type { PaymentType, ServicePointType } from './logisticsEnums';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface OrderDeliveryDetailItem {
  id: string;
  articleId: string | null;
  articleName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// "Corporate": orden ligada a un proveedor con artículos de inventario.
// "Sporadic": orden de mostrador creada vía /shipments/sporadic, sin proveedor ni artículos de inventario.
export type OrderType = "Corporate" | "Sporadic";

export interface OrderDelivery {
  id: string;
  supplierId: string | null;
  supplierName: string | null;
  userId: string;
  /**
   * @deprecated Para auditoría usar `createdBy`. En toda la API el "hecho por
   * quién" se expone como correo, no como nombre.
   */
  userName?: string;
  // Correo de quien creó la orden. Mismo criterio que `Shipment.createdBy` y
  // que `attendedByEmail`.
  createdBy: string;
  orderType: OrderType;
  originDepartment: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  destinationDepartment: string;
  // Sucursal de destino declarada por quien creó la orden. Es una indicación:
  // el admin puede elegir otra al crear el envío y la orden no se toca.
  // Queda null en las órdenes anteriores al campo y en las que no la declararon.
  destinationBranchOfficeId: string | null;
  destinationBranchOfficeCode: string | null;
  destinationBranchOfficeCity: string | null;
  clientPhone: string;
  clientPhoneAlt?: string | null;
  clientFullName: string;
  clientAddress: string;
  // Modalidad de destino. `Branch` = el cliente retira en mostrador y el envío
  // no se asigna a ningún conductor.
  destinationPointType?: ServicePointType | null;
  destinationLocationUrl?: string | null;
  destinationAddressReference?: string | null;
  // Antes `deliveryType`. Suma `OnAccount`, que solo admiten las empresas con
  // cuenta corriente habilitada.
  paymentType: PaymentType;
  isExpress: boolean;
  totalPrice: number;
  isAttended: boolean;
  createdAt: string;
  // Atención: los 5 campos de abajo no son columnas de la orden, los deriva el
  // backend del envío activo. Vienen poblados exactamente cuando `isAttended`
  // es true y en null cuando es false — no existe el caso intermedio, así que
  // `attendedAt != null` e `isAttended` son el mismo booleano.
  attendedAt?: string | null;
  // El CORREO de quien atendió, no el nombre: en toda la API el "hecho por
  // quién" de auditoría se expone como correo.
  attendedByEmail?: string | null;
  shipmentId?: string | null;
  // Código legible del envío (`COR-000123` corporativo, `ESP-000123`
  // esporádico). Es el que se muestra; `shipmentWaybillNumber` es el
  // correlativo crudo de 8 dígitos.
  shipmentCode?: string | null;
  shipmentWaybillNumber?: string | null;
  details: OrderDeliveryDetailItem[];
}

export interface OrderDeliveryPaginatedItem {
  id: string;
  supplierId: string | null;
  supplierName: string | null;
  orderType: OrderType;
  clientFullName: string;
  clientPhone: string;
  // Correo de quien creó la orden. Opcional hasta que el backend lo exponga en
  // el listado: se usa para ocultar Editar/Eliminar sobre órdenes ajenas.
  createdBy?: string | null;
  destinationDepartment: string;
  destinationBranchOfficeId: string | null;
  destinationBranchOfficeCode: string | null;
  destinationBranchOfficeCity: string | null;
  destinationPointType?: ServicePointType | null;
  paymentType: PaymentType;
  isExpress: boolean;
  totalPrice: number;
  isAttended: boolean;
  createdAt: string;
  // Ver la nota en `OrderDelivery`: derivados del envío, todos null o todos
  // poblados según `isAttended`. Vienen en el listado también, así que la
  // columna de fecha no necesita pedir nada por fila.
  attendedAt?: string | null;
  attendedByEmail?: string | null;
  shipmentId?: string | null;
  shipmentCode?: string | null;
  shipmentWaybillNumber?: string | null;
}

export interface OrderDeliveriesPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: OrderDeliveryPaginatedItem[];
}

export interface CreateOrderDeliveryLineRequest {
  articleId: string;
  quantity: number;
  unitPrice: number;
}

// Los enums van como NOMBRE ("LaPaz", "Prepaid"), igual que en el resto de la
// API. Antes se mandaba el índice del selector, que ataba el contrato al orden
// de un arreglo del front.
export interface CreateOrderDeliveryRequest {
  destinationDepartment: BolivianDepartment;
  // Opcional salvo que el destino sea `Branch`. Si va, el backend valida que
  // pertenezca a `destinationDepartment` (400
  // `orderdelivery.destinationbranch.mismatch`); no lo corrige en silencio.
  destinationBranchOfficeId?: string | null;
  /**
   * Modalidad de destino.
   *   `Branch` → `destinationBranchOfficeId` obligatorio
   *              (`orderdelivery.destinationbranch.required`).
   *   `Door`   → `clientAddress` obligatorio
   *              (`orderdelivery.destinationaddress.required`).
   *
   * El ORIGEN no se elige: una orden corporativa despacha siempre desde el
   * mostrador. Un origen a domicilio es una solicitud de recojo.
   */
  destinationPointType: ServicePointType;
  clientPhone: string;
  clientPhoneAlt?: string | null;
  clientFullName: string;
  clientAddress: string;
  // El enlace de mapa acá es deseable, no requerido: el mostrador siempre
  // trabajó con la dirección escrita y las órdenes viejas no lo tienen.
  destinationLocationUrl?: string | null;
  destinationAddressReference?: string | null;
  /** `OnAccount` solo si la empresa tiene `hasCreditAccount`. */
  paymentType: PaymentType;
  isExpress: boolean;
  lines: CreateOrderDeliveryLineRequest[];
}

// El PUT reemplaza la orden completa: omitir `destinationBranchOfficeId` la
// deja sin sucursal. Al editar hay que precargar la que vino del GET y
// remandarla, o se borra el dato que declaró el proveedor.
export type UpdateOrderDeliveryRequest = CreateOrderDeliveryRequest;

// ─── Service ─────────────────────────────────────────────────────────────────

export interface OrderDeliveryListFilters {
  // Solo lo respeta superadmin: al usuarioempresa el backend le fuerza su
  // proveedor y al admin le limita el listado a su departamento.
  supplierId?: string;
  // Omitirlo equivale a `All`.
  attentionStatus?: AttentionStatus;
  // Rango sobre la fecha de creación de la orden, en formato `yyyy-MM-dd`.
  // Ambos extremos inclusive; `dateTo` cubre el día completo hasta las 23:59:59.
  // `dateFrom > dateTo` → 400 `orderdelivery.daterange.invalid`.
  dateFrom?: string;
  dateTo?: string;
}

// Estado de atención de la orden. Reemplaza al viejo `unattended` (bool), que
// solo sabía hacer la mitad del trabajo: `false` no filtraba nada y devolvía
// todas mezcladas, así que la opción "atendidas" mostraba datos incorrectos.
//
// `All` es el default del backend cuando el parámetro no viaja.
export type AttentionStatus = 'All' | 'Attended' | 'Unattended';

export const ATTENTION_STATUS_LABELS: Record<AttentionStatus, string> = {
  Unattended: 'Por atender',
  Attended: 'Atendidas',
  All: 'Todas',
};

// Orden en que se muestran las pestañas: primero la bandeja de trabajo.
export const ATTENTION_STATUS_TABS: AttentionStatus[] = ['Unattended', 'Attended', 'All'];

// Totales por estado, para los contadores de los tabs.
export interface OrderDeliveryCounts {
  total: number;
  pending: number;
  attended: number;
}

export const orderDeliveryService = {
  /**
   * Cantidades reales por estado, tomadas del `count` del servidor.
   *
   * NO se cuentan las filas de una página: el backend recorta `perPage`, así que
   * pedir un "lote grande" y contar en memoria da de menos y sin avisar. `count`
   * es el total de la consulta, independiente de la paginación.
   *
   * Son dos requests de una fila cada uno; lo que interesa es el `count`.
   */
  getCounts: async (
    filters: OrderDeliveryListFilters = {}
  ): Promise<OrderDeliveryCounts> => {
    const [pending, attended] = await Promise.all([
      orderDeliveryService.getDeliveries(1, 1, { ...filters, attentionStatus: 'Unattended' }),
      orderDeliveryService.getDeliveries(1, 1, { ...filters, attentionStatus: 'Attended' }),
    ]);
    return {
      // `isAttended` es booleano, así que las dos ramas cubren el total.
      total: pending.count + attended.count,
      pending: pending.count,
      attended: attended.count,
    };
  },

  getDeliveries: async (
    page = 1,
    perPage = 10,
    filters: OrderDeliveryListFilters = {}
  ): Promise<OrderDeliveriesPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
    if (filters.supplierId) query.append('supplierId', filters.supplierId);
    // `All` es el default del backend, así que no hace falta mandarlo.
    if (filters.attentionStatus && filters.attentionStatus !== 'All') {
      query.append('attentionStatus', filters.attentionStatus);
    }
    if (filters.dateFrom) query.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) query.append('dateTo', filters.dateTo);
    return apiClient<OrderDeliveriesPaginatedResponse>(
      `/order-deliveries?${query.toString()}`
    );
  },

  getDeliveryById: async (id: string): Promise<OrderDelivery> => {
    return apiClient<OrderDelivery>(`/order-deliveries/${id}`);
  },

  createDelivery: async (
    data: CreateOrderDeliveryRequest
  ): Promise<OrderDelivery> => {
    return apiClient<OrderDelivery>('/order-deliveries', {
      method: 'POST',
      data,
    });
  },

  updateDelivery: async (
    id: string,
    data: UpdateOrderDeliveryRequest
  ): Promise<OrderDelivery> => {
    return apiClient<OrderDelivery>(`/order-deliveries/${id}`, {
      method: 'PUT',
      data,
    });
  },

  deleteDelivery: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/order-deliveries/${id}`, {
      method: 'DELETE',
    });
  },
};
