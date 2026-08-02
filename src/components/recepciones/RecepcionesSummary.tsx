import React from "react";

interface RecepcionesSummaryProps {
  totalRecepciones: number;
  unidadesHoy: number;
  articulosDisponibles: number;
  loading: boolean;
}

export default function RecepcionesSummary({
  totalRecepciones,
  unidadesHoy,
  articulosDisponibles,
  loading,
}: RecepcionesSummaryProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Recepciones Registradas */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
          <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            Recepciones Registradas
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : totalRecepciones}
          </p>
        </div>
      </div>

      {/* Unidades Recibidas Hoy */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
          <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            Unidades Recibidas Hoy
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {loading ? "—" : `+${unidadesHoy}`}
          </p>
        </div>
      </div>

      {/* Artículos Disponibles */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/10">
          <svg className="h-6 w-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            Artículos Disponibles
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {articulosDisponibles}
          </p>
        </div>
      </div>
    </div>
  );
}
