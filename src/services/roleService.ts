import { apiClient } from './apiClient';

// Id semilla del rol conductor. El admin lo necesita para crear conductores
// pero no puede listar roles (GET /roles es solo superadmin → 403).
export const CONDUCTOR_ROLE_ID = '44444444-4444-4444-4444-444444444444';

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface RolesPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: Role[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
}

export const roleService = {
  getRoles: async (page = 1, perPage = 10): Promise<RolesPaginatedResponse> => {
    return apiClient<RolesPaginatedResponse>(`/roles?page=${page}&perPage=${perPage}`);
  },

  getRoleById: async (id: string): Promise<Role> => {
    return apiClient<Role>(`/roles/${id}`);
  },

  createRole: async (data: CreateRoleRequest): Promise<Role> => {
    return apiClient<Role>('/roles', {
      method: 'POST',
      data,
    });
  },

  updateRole: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    return apiClient<Role>(`/roles/${id}`, {
      method: 'PUT',
      data,
    });
  },

  deleteRole: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/roles/${id}`, {
      method: 'DELETE',
    });
  },
};
