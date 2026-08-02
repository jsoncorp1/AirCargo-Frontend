import React from "react";

interface ProveedoresSummaryProps {
  totalProveedores: number;
  totalUsuarios: number;
  loading: boolean;
}

export default function ProveedoresSummary({ totalProveedores, totalUsuarios, loading }: ProveedoresSummaryProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Total Proveedores */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
          <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            Total Proveedores
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : totalProveedores}
          </p>
        </div>
      </div>

      {/* Usuarios Vinculados */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-info-50 dark:bg-info-500/10">
          <svg className="h-6 w-6 text-info-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            Usuarios Vinculados
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : totalUsuarios}
          </p>
        </div>
      </div>
    </div>
  );
}
