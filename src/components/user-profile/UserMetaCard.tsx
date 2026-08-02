"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";

function getInitials(fullName?: string | null) {
  if (!fullName) return "U";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserMetaCard() {
  const { user, isSupplierUser, companyName, branchOfficeCode, branchOfficeCity } = useAuth();

  return (
    <div className="p-5 lg:p-8 border border-gray-100 rounded-2xl dark:border-gray-800 bg-white dark:bg-white/[0.02] shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        
        {/* Avatar */}
        <div className="flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-brand-500 text-white text-3xl sm:text-4xl font-bold shadow-theme-md select-none ring-4 ring-brand-50 dark:ring-brand-500/20">
          {getInitials(user?.fullName)}
        </div>
        
        {/* User Info */}
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {user?.fullName || "Usuario no identificado"}
          </h4>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {user?.role || "Sin Rol"}
            </div>
            <div className="hidden sm:block h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            <span>{user?.email || "Sin correo"}</span>
          </div>
          
          {/* Contextual Info based on Role */}
          <div className="mt-4 p-4 rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/30 inline-block text-left w-full sm:w-auto">
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Información de Acceso
            </h5>
            {isSupplierUser ? (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Proveedor Asociado
                </span>
                <span className="text-sm text-brand-600 dark:text-brand-400 font-semibold">
                  {companyName || "No registrado"}
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Sucursal Asignada
                </span>
                <span className="text-sm text-brand-600 dark:text-brand-400 font-semibold">
                  {branchOfficeCode ? `${branchOfficeCode} - ${branchOfficeCity}` : "Oficina Central / Sin sucursal"}
                </span>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
