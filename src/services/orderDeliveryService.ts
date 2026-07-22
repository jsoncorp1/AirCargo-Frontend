import { apiClient } from './apiClient';

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
  userName: string;
  orderType: OrderType;
  originDepartment: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  destinationDepartment: string;
  clientPhone: string;
  clientFullName: string;
  clientAddress: string;
  deliveryType: string;
  totalPrice: number;
  isAttended: boolean;
  createdAt: string;
  details: OrderDeliveryDetailItem[];
}

export interface OrderDeliveryPaginatedItem {
  id: string;
  supplierId: string | null;
  supplierName: string | null;
  orderType: OrderType;
  clientFullName: string;
  destinationDepartment: string;
  deliveryType: string;
  totalPrice: number;
  isAttended: boolean;
  createdAt: string;
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

export interface CreateOrderDeliveryRequest {
  destinationDepartment: number;
  clientPhone: string;
  clientFullName: string;
  clientAddress: string;
  deliveryType: number;
  lines: CreateOrderDeliveryLineRequest[];
}

export interface UpdateOrderDeliveryRequest {
  destinationDepartment: number;
  clientPhone: string;
  clientFullName: string;
  clientAddress: string;
  deliveryType: number;
  lines: CreateOrderDeliveryLineRequest[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const orderDeliveryService = {
  getDeliveries: async (
    page = 1,
    perPage = 10,
    supplierId?: string
  ): Promise<OrderDeliveriesPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
    if (supplierId) query.append('supplierId', supplierId);
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
