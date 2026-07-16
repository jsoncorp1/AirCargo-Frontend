"use client";

import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon, BoxIconLine, GroupIcon, CalenderIcon, CheckCircleIcon } from "@/icons";
import { envioService } from "@/services/envioService";
import { conductorService } from "@/services/conductorService";

export const LogisticsMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalEnvios: 0,
    enTransito: 0,
    conductoresActivos: 0,
    ingresos: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      const [envios, conductores] = await Promise.all([
        envioService.getEnvios(),
        conductorService.getConductores()
      ]);

      setMetrics({
        totalEnvios: envios.length,
        enTransito: envios.filter(e => e.estado === "En Camino").length,
        conductoresActivos: conductores.filter(c => c.estado === "Disponible" || c.estado === "En Ruta").length,
        ingresos: envios.reduce((acc, curr) => acc + curr.costoTotal, 0),
      });
    };
    fetchMetrics();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      
      {/* Metric 1 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-brand-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Envíos</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.totalEnvios}
            </h4>
          </div>
          <Badge color="success"><ArrowUpIcon />12%</Badge>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <CalenderIcon className="text-warning-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">En Tránsito</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.enTransito}
            </h4>
          </div>
          <Badge color="warning">En progreso</Badge>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-info-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Conductores Activos</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.conductoresActivos}
            </h4>
          </div>
          <Badge color="success">Óptimo</Badge>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <CheckCircleIcon className="text-success-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Ingresos Proyectados</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              Bs {metrics.ingresos}
            </h4>
          </div>
          <Badge color="success"><ArrowUpIcon />5%</Badge>
        </div>
      </div>

    </div>
  );
};
