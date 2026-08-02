import type { Metadata } from "next";
import React from "react";
import { LogisticsMetrics } from "@/components/dashboard/LogisticsMetrics";
import EnviosPorMesChart from "@/components/dashboard/EnviosPorMesChart";
import EnviosRecientes from "@/components/dashboard/EnviosRecientes";

export const metadata: Metadata = {
  title: "Dashboard Logístico | AirCargo",
  description: "Torre de Control de Envíos",
};

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Torre de Control</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Resumen general de las operaciones logísticas y estado de envíos.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm">
             Descargar Reporte
           </button>
           <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition shadow-brand-500/20 shadow-lg flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
             Nuevo Envío
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Top Metrics */}
        <div className="col-span-12">
          <LogisticsMetrics />
        </div>

        {/* Chart */}
        <div className="col-span-12 xl:col-span-7">
          <EnviosPorMesChart />
        </div>

        {/* Recent Orders / Envíos */}
        <div className="col-span-12 xl:col-span-5">
          <EnviosRecientes />
        </div>
      </div>
    </div>
  );
}
