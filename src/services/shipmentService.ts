import { apiClient } from './apiClient';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ShipmentDetailItem {
  id: string;
  orderDeliveryDetailId: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  weight: number;
  shippingCost: number;
}

export interface Shipment {
  id: string;
  orderDeliveryId: string;
  waybillNumber: string;
  code: string;
  originDepartment: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  clientFullName: string;
  clientAddress: string;
  destinationDepartment: string;
  totalWeight: number;
  shippingPrice: number;
  packageCount: number;
  packageDescription: string;
  createdAt: string;
  createdBy: string;
  details: ShipmentDetailItem[];
}

export interface ShipmentPaginatedItem {
  id: string;
  orderDeliveryId: string;
  waybillNumber: string;
  code: string;
  clientFullName: string;
  totalWeight: number;
  shippingPrice: number;
  packageCount: number;
  createdAt: string;
}

export interface ShipmentsPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: ShipmentPaginatedItem[];
}

export interface CreateShipmentLineRequest {
  orderDeliveryDetailId: string;
  weight: number;
  shippingCost: number;
}

export interface CreateShipmentRequest {
  orderDeliveryId: string;
  packageCount: number;
  packageDescription: string;
  lines: CreateShipmentLineRequest[];
}

export interface UpdateShipmentLineRequest {
  shipmentDetailId: string;
  weight: number;
  shippingCost: number;
}

export interface UpdateShipmentRequest {
  packageCount: number;
  packageDescription: string;
  lines: UpdateShipmentLineRequest[];
}

// ─── DTOs: envío esporádico (mostrador) ────────────────────────────────────────

export interface CreateSporadicShipmentLineRequest {
  articleName: string;
  quantity: number;
  unitPrice: number;
  weight: number;
  shippingCost: number;
}

export interface CreateSporadicShipmentRequest {
  originDepartment: string;
  senderFullName: string;
  senderPhone: string;
  senderAddress: string;
  destinationDepartment: string;
  clientPhone: string;
  clientFullName: string;
  clientAddress: string;
  deliveryType: string;
  packageCount: number;
  packageDescription: string;
  lines: CreateSporadicShipmentLineRequest[];
}

export interface SporadicShipmentDetailItem {
  orderDeliveryDetailId: string;
  shipmentDetailId: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  weight: number;
  shippingCost: number;
}

export interface SporadicShipmentResponse {
  orderDeliveryId: string;
  shipmentId: string;
  code: string;
  totalPrice: number;
  totalWeight: number;
  shippingPrice: number;
  packageCount: number;
  packageDescription: string;
  details: SporadicShipmentDetailItem[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const shipmentService = {
  getShipments: async (
    page = 1,
    perPage = 10,
    supplierId?: string
  ): Promise<ShipmentsPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
    if (supplierId) query.append('supplierId', supplierId);
    return apiClient<ShipmentsPaginatedResponse>(`/shipments?${query.toString()}`);
  },

  getShipmentById: async (id: string): Promise<Shipment> => {
    return apiClient<Shipment>(`/shipments/${id}`);
  },

  createShipment: async (data: CreateShipmentRequest): Promise<Shipment> => {
    return apiClient<Shipment>('/shipments', {
      method: 'POST',
      data,
    });
  },

  updateShipment: async (
    id: string,
    data: UpdateShipmentRequest
  ): Promise<Shipment> => {
    return apiClient<Shipment>(`/shipments/${id}`, {
      method: 'PUT',
      data,
    });
  },

  deleteShipment: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/shipments/${id}`, {
      method: 'DELETE',
    });
  },

  createSporadicShipment: async (
    data: CreateSporadicShipmentRequest
  ): Promise<SporadicShipmentResponse> => {
    return apiClient<SporadicShipmentResponse>('/shipments/sporadic', {
      method: 'POST',
      data,
    });
  },
};
