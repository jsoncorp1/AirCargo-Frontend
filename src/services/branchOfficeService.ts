import { apiClient } from './apiClient';
import { BolivianDepartment } from './supplierService';

export interface BranchOffice {
  id: string;
  code: string;
  bolivianDepartment: BolivianDepartment;
  city: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  active: boolean;
}

export interface BranchOfficesPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: BranchOffice[];
}

export interface CreateBranchOfficeRequest {
  code: string;
  bolivianDepartment: BolivianDepartment;
  city: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
}

export type UpdateBranchOfficeRequest = CreateBranchOfficeRequest;

export const branchOfficeService = {
  // `department` es opcional y va como NOMBRE del enum ("LaPaz"), no como
  // índice: un número da 400 `branchoffice.department.invalid` en vez de
  // filtrar por nada y devolver 200 con la lista vacía. Es case-insensitive.
  // El listado nunca incluye sucursales dadas de baja, así que no hace falta
  // filtrar por `active` acá ni en memoria.
  getBranchOffices: async (
    page = 1,
    perPage = 10,
    department?: BolivianDepartment
  ): Promise<BranchOfficesPaginatedResponse> => {
    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });
    if (department) query.append('department', department);
    return apiClient<BranchOfficesPaginatedResponse>(`/branch-offices?${query}`);
  },
  getBranchOfficeById: async (id: string): Promise<BranchOffice> => {
    return apiClient<BranchOffice>(`/branch-offices/${id}`);
  },
  createBranchOffice: async (data: CreateBranchOfficeRequest): Promise<BranchOffice> => {
    return apiClient<BranchOffice>('/branch-offices', {
      method: 'POST',
      data,
    });
  },
  updateBranchOffice: async (id: string, data: UpdateBranchOfficeRequest): Promise<BranchOffice> => {
    return apiClient<BranchOffice>(`/branch-offices/${id}`, {
      method: 'PUT',
      data,
    });
  },
  deleteBranchOffice: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/branch-offices/${id}`, {
      method: 'DELETE',
    });
  },
};
