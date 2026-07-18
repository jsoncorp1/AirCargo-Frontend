import { apiClient } from './apiClient';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dni: string;
  roleId: string;
  roleName: string;
}

export interface UsersPaginatedResponse {
  page: number;
  perPage: number;
  totalPages: number;
  count: number;
  data: User[];
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  dni?: string;
  roleId: string;
}

export const userService = {
  getUsers: async (page = 1, perPage = 10): Promise<UsersPaginatedResponse> => {
    return apiClient<UsersPaginatedResponse>(`/users?page=${page}&perPage=${perPage}`);
  },

  getUserById: async (id: string): Promise<User> => {
    return apiClient<User>(`/users/${id}`);
  },

  createUser: async (data: CreateUserRequest): Promise<User> => {
    return apiClient<User>('/users', {
      method: 'POST',
      data,
    });
  },
  updateUser: async (id: string, data: Partial<CreateUserRequest>): Promise<User> => {
    return apiClient<User>(`/users/${id}`, {
      method: 'PUT',
      data,
    });
  },
  deleteUser: async (id: string): Promise<{ id: string }> => {
    return apiClient<{ id: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
