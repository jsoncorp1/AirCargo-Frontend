"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginRequest, LoginResponse } from '../services/authService';

interface AuthSessionUser extends LoginResponse {
  companyId: string | null;
  companyName: string | null;
}

interface AuthContextType {
  user: AuthSessionUser | null;
  companyId: string | null;
  companyName: string | null;
  branchOfficeId: string | null;
  branchOfficeCode: string | null;
  branchOfficeCity: string | null;
  role: string | null;
  isSupplierUser: boolean;
  isAdminUser: boolean;
  isConductorUser: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const isSupplierRole = (role?: string | null): boolean =>
  role?.toLowerCase() === 'usuarioempresa';

export const isAdminRole = (role?: string | null): boolean =>
  role?.toLowerCase() === 'admin';

export const isConductorRole = (role?: string | null): boolean =>
  role?.toLowerCase() === 'conductor';

const decodeTokenPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const buildSessionUser = (response: LoginResponse): AuthSessionUser => {
  const payload = decodeTokenPayload(response.token);
  const companyId =
    response.supplierId ||
    (payload?.companyId as string | undefined) ||
    (payload?.supplierId as string | undefined) ||
    (payload?.empresaId as string | undefined) ||
    null;

  // La sucursal viene en la respuesta del login; si no, se toma el claim
  // `branchOfficeId` del JWT ("" cuando el usuario no tiene sucursal).
  const branchOfficeId =
    response.branchOfficeId ||
    (payload?.branchOfficeId as string | undefined) ||
    null;

  return {
    ...response,
    companyId,
    companyName: response.supplierName ?? null,
    branchOfficeId,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for saved user in localStorage on initial load
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as LoginResponse;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(buildSessionUser({ ...parsedUser, token: savedToken }));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authService.login(data);
      const sessionUser = buildSessionUser(response);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      if (isSupplierRole(sessionUser.role)) {
        router.push('/proveedor/ordenes');
      } else if (isAdminRole(sessionUser.role)) {
        router.push('/dashboard');
      } else if (isConductorRole(sessionUser.role)) {
        router.push('/conductor/envios');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/signin');
  };

  return (
    <AuthContext.Provider value={{
      user,
      companyId: user?.companyId ?? null,
      companyName: user?.companyName ?? null,
      branchOfficeId: user?.branchOfficeId ?? null,
      branchOfficeCode: user?.branchOfficeCode ?? null,
      branchOfficeCity: user?.branchOfficeCity ?? null,
      role: user?.role ?? null,
      isSupplierUser: isSupplierRole(user?.role),
      isAdminUser: isAdminRole(user?.role),
      isConductorUser: isConductorRole(user?.role),
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
