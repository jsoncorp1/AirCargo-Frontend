"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { BoxCubeIcon, PageIcon, UserCircleIcon, CheckCircleIcon, TimeIcon } from "@/icons";

export default function AdminDashboardPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Dashboard" />

      {/* KPI Cards (Mock Data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-xl flex items-center justify-center">
              <BoxCubeIcon className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Envíos Hoy</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">124</h3>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-success-500 font-semibold">+12%</span>
            <span className="text-gray-500 ml-2">vs ayer</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-success-50 dark:bg-success-500/10 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-success-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Entregas Exitosas</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">89%</h3>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-success-500 font-semibold">Tasa de efectividad</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-warning-50 dark:bg-warning-500/10 rounded-xl flex items-center justify-center">
              <TimeIcon className="w-6 h-6 text-warning-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">En Tránsito</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">45</h3>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-warning-500 font-semibold">Paquetes en ruta</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Conductores Activos</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">12 / 15</h3>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-blue-500 font-semibold">En turno</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Mock */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Volumen de Envíos (Semana)</h4>
          <div className="flex-1 flex items-end gap-2 sm:gap-6 justify-between px-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            {[45, 60, 35, 80, 55, 90, 75].map((h, i) => (
              <div key={i} className="w-full flex flex-col items-center justify-end gap-3 h-64">
                <div className="w-full bg-brand-500/20 hover:bg-brand-500 transition-colors rounded-t-md relative group" style={{ height: `${h}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h * 2} envíos
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium uppercase">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad Reciente Mock */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Actividad Reciente</h4>
          <div className="space-y-6">
            {[
              { time: "10:45 AM", text: "Envío GUIA-1001 entregado", user: "Conductor: Juan P.", type: "success" },
              { time: "10:30 AM", text: "Nueva orden recibida", user: "Cliente: Tienda Moda", type: "info" },
              { time: "09:15 AM", text: "Envío GUIA-992 observado", user: "Motivo: Cliente ausente", type: "warning" },
              { time: "08:00 AM", text: "Liquidación pagada", user: "Admin", type: "success" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== 3 && <div className="absolute left-2.5 top-6 bottom-[-20px] w-px bg-gray-200 dark:bg-gray-800"></div>}
                <div className={`w-5 h-5 rounded-full mt-0.5 z-10 border-4 border-white dark:border-gray-900 ${item.type === 'success' ? 'bg-success-500' : item.type === 'warning' ? 'bg-warning-500' : 'bg-brand-500'}`}></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.text}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.user}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
