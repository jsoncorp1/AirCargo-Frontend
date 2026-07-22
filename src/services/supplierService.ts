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

export interface Supplier {
  id: string;
  name: string;
  description?: string;
  department?: BolivianDepartment;
  articleQuantity?: number;
  userQuantity?: number;
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
}

export interface UpdateSupplierRequest {
  name: string;
  description?: string;
  department?: BolivianDepartment;
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
