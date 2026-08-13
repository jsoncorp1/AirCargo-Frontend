"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginRequest, LoginResponse } from '../services/authService';
import { ROLE_NAMES, normalizeRoleName, isSuperAdminRole } from '../services/userScope';

// Etiqueta a mostrar cuando el usuario no tiene sucursal propia. El superadmin
// es global: no pertenece a ninguna sucursal, así que sus campos
// `branchOffice*` vienen en `null` desde el login.
export const GLOBAL_BRANCH_LABEL = 'Todas las sucursales';

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
  // Texto listo para mostrar: la sucursal del usuario, o "Todas las sucursales"
  // cuando no tiene ninguna (superadmin).
  branchOfficeLabel: string;
  // `true` cuando el usuario no está atado a una sucursal (superadmin): los
  // formularios de envío deben pedirle que elija la sucursal de origen.
  hasGlobalScope: boolean;
  role: string | null;
  isSupplierUser: boolean;
  isAdminUser: boolean;
  isConductorUser: boolean;
  isSuperAdminUser: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const isSupplierRole = (role?: string | null): boolean =>
  normalizeRoleName(role) === ROLE_NAMES.usuarioEmpresa;

export const isAdminRole = (role?: string | null): boolean =>
  normalizeRoleName(role) === ROLE_NAMES.admin;

export const isConductorRole = (role?: string | null): boolean =>
  normalizeRoleName(role) === ROLE_NAMES.conductor;

export { isSuperAdminRole };

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
  // Para el superadmin ambos vienen vacíos: es global, no tiene sucursal.
  const branchOfficeId =
    response.branchOfficeId ||
    (payload?.branchOfficeId as string | undefined) ||
    null;

  return {
    ...response,
    companyId,
    companyName: response.supplierName ?? null,
    branchOfficeId,
    // Se normalizan a `null` para que un "" del backend no pase los chequeos
    // de verdad/falsedad de los componentes que muestran la sucursal.
    branchOfficeCode: response.branchOfficeCode || null,
    branchOfficeCity: response.branchOfficeCity || null,
  };
};

const buildBranchOfficeLabel = (
  code?: string | null,
  city?: string | null
): string => {
  const label = [code, city].filter(Boolean).join(' — ');
  return label || GLOBAL_BRANCH_LABEL;
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
      branchOfficeLabel: buildBranchOfficeLabel(
        user?.branchOfficeCode,
        user?.branchOfficeCity
      ),
      hasGlobalScope: !!user && !user.branchOfficeId && !user.companyId,
      role: user?.role ?? null,
      isSupplierUser: isSupplierRole(user?.role),
      isAdminUser: isAdminRole(user?.role),
      isConductorUser: isConductorRole(user?.role),
      isSuperAdminUser: isSuperAdminRole(user?.role),
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
