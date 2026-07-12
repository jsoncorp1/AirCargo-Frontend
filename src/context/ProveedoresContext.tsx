"use client";

import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { Empresa, empresasIniciales } from "@/data/mock/empresas";
import { UsuarioProveedor, usuariosIniciales } from "@/data/mock/usuarios";
import { Articulo, articulosIniciales } from "@/data/mock/articulos";

const today = () => new Date().toISOString().slice(0, 10);
const newId = (prefix: string) =>
  `${prefix}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8)}`;

interface ProveedoresContextValue {
  empresas: Empresa[];
  usuarios: UsuarioProveedor[];
  articulos: Articulo[];
  addEmpresa: (data: Omit<Empresa, "id" | "fechaRegistro">) => void;
  updateEmpresa: (id: string, data: Omit<Empresa, "id" | "fechaRegistro">) => void;
  deleteEmpresa: (id: string) => void;
  addUsuario: (data: Omit<UsuarioProveedor, "id" | "fechaRegistro">) => void;
  updateUsuario: (id: string, data: Omit<UsuarioProveedor, "id" | "fechaRegistro">) => void;
  deleteUsuario: (id: string) => void;
  addArticulo: (data: Omit<Articulo, "id" | "fechaRegistro">) => void;
  updateArticulo: (id: string, data: Omit<Articulo, "id" | "fechaRegistro">) => void;
  deleteArticulo: (id: string) => void;
}

const ProveedoresContext = createContext<ProveedoresContextValue | null>(null);

export function ProveedoresProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>(empresasIniciales);
  const [usuarios, setUsuarios] = useState<UsuarioProveedor[]>(usuariosIniciales);
  const [articulos, setArticulos] = useState<Articulo[]>(articulosIniciales);

  const value = useMemo<ProveedoresContextValue>(
    () => ({
      empresas,
      usuarios,
      articulos,
      addEmpresa: (data) =>
        setEmpresas((prev) => [...prev, { ...data, id: newId("emp"), fechaRegistro: today() }]),
      updateEmpresa: (id, data) =>
        setEmpresas((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e))),
      deleteEmpresa: (id) => {
        setEmpresas((prev) => prev.filter((e) => e.id !== id));
        setUsuarios((prev) => prev.filter((u) => u.empresaId !== id));
        setArticulos((prev) => prev.filter((a) => a.empresaId !== id));
      },
      addUsuario: (data) =>
        setUsuarios((prev) => [...prev, { ...data, id: newId("usr"), fechaRegistro: today() }]),
      updateUsuario: (id, data) =>
        setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u))),
      deleteUsuario: (id) => setUsuarios((prev) => prev.filter((u) => u.id !== id)),
      addArticulo: (data) =>
        setArticulos((prev) => [...prev, { ...data, id: newId("art"), fechaRegistro: today() }]),
      updateArticulo: (id, data) =>
        setArticulos((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a))),
      deleteArticulo: (id) => setArticulos((prev) => prev.filter((a) => a.id !== id)),
    }),
    [empresas, usuarios, articulos]
  );

  return <ProveedoresContext.Provider value={value}>{children}</ProveedoresContext.Provider>;
}

export function useProveedoresData() {
  const ctx = useContext(ProveedoresContext);
  if (!ctx) {
    throw new Error("useProveedoresData debe usarse dentro de ProveedoresProvider");
  }
  return ctx;
}
