import React from "react";
import { BoxCubeIcon, TaskIcon } from "@/icons";

interface EnviosSummaryProps {
  totalShipmentsCount: number;
  totalWeight: number;
  totalRevenue: number;
  loading: boolean;
}

export default function EnviosSummary({
  totalShipmentsCount,
  totalWeight,
  totalRevenue,
  loading,
}: EnviosSummaryProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total Shipments */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
          <BoxCubeIcon className="h-6 w-6 text-brand-500" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            Total Envíos Registrados
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : totalShipmentsCount}
          </p>
        </div>
      </div>

      {/* Total Weight */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/10">
          <svg className="h-6 w-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            Peso Total de la Página
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : `${totalWeight.toFixed(2)} kg`}
          </p>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
          <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            Costo de Envío de la Página
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : `Bs ${totalRevenue.toFixed(2)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
