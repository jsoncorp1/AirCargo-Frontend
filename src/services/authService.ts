import { apiClient } from './apiClient';

export interface LoginRequest {
  email: string;
  password?: string; // It's optional so we can bypass for quick testing, but real backend requires it
}

export interface LoginResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
  roleId?: string;
  supplierId?: string;
  supplierName?: string;
  // Sucursal del usuario (null si no tiene sucursal asignada).
  branchOfficeId?: string | null;
  branchOfficeCode?: string | null;
  branchOfficeCity?: string | null;
  token: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      data,
    });
  },
};
