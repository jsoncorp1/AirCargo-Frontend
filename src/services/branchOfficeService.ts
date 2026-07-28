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
  getBranchOffices: async (page = 1, perPage = 10): Promise<BranchOfficesPaginatedResponse> => {
    return apiClient<BranchOfficesPaginatedResponse>(`/branch-offices?page=${page}&perPage=${perPage}`);
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
