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
  numeroGuia: string;
  clienteNombreCompleto: string;
  clienteDireccion: string;
  departamento: string;
  totalWeight: number;
  shippingPrice: number;
  createdAt: string;
  details: ShipmentDetailItem[];
}

export interface ShipmentPaginatedItem {
  id: string;
  orderDeliveryId: string;
  numeroGuia: string;
  clienteNombreCompleto: string;
  totalWeight: number;
  shippingPrice: number;
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
  lines: CreateShipmentLineRequest[];
}

export interface UpdateShipmentLineRequest {
  shipmentDetailId: string;
  weight: number;
  shippingCost: number;
}

export interface UpdateShipmentRequest {
  lines: UpdateShipmentLineRequest[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const shipmentService = {
  getShipments: async (
    page = 1,
    perPage = 10
  ): Promise<ShipmentsPaginatedResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });
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
};
