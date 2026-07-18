"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginRequest, LoginResponse } from '../services/authService';

interface AuthSessionUser extends LoginResponse {
  companyId: string | null;
}

interface AuthContextType {
  user: AuthSessionUser | null;
  companyId: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
    (payload?.companyId as string | undefined) ||
    (payload?.supplierId as string | undefined) ||
    (payload?.empresaId as string | undefined) ||
    null;

  return {
    ...response,
    companyId,
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
      router.push('/');
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
    <AuthContext.Provider value={{ user, companyId: user?.companyId ?? null, role: user?.role ?? null, isAuthenticated: !!user, isLoading, login, logout }}>
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
