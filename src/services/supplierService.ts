import { apiClient } from './apiClient';

export interface Supplier {
  id: string;
  name: string;
  description?: string;
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
}

export interface UpdateSupplierRequest {
  name: string;
  description?: string;
}

export const supplierService = {
  getSuppliers: async (page = 1, perPage = 10): Promise<SuppliersPaginatedResponse> => {
    return apiClient<SuppliersPaginatedResponse>(`/suppliers?page=${page}&perPage=${perPage}`);
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
