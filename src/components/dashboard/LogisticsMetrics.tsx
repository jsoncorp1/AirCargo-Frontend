"use client";

import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { Package, Truck, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

export const LogisticsMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalEnvios: 0,
    enTransito: 0,
    entregados: 0,
    observados: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hardcoded dummy metrics
    setMetrics({
      totalEnvios: 125,
      enTransito: 45,
      entregados: 75,
      observados: 5,
    });
    setLoading(false);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">

      {/* Metric 1 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl dark:bg-brand-500/10">
          <Package className="text-brand-600 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Envíos</span>
            <h4 className="mt-1.5 font-bold text-gray-900 text-title-sm dark:text-white">
              {loading ? "..." : metrics.totalEnvios}
            </h4>
          </div>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-info-50 rounded-xl dark:bg-info-500/10">
          <Truck className="text-info-600 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">En Tránsito</span>
            <h4 className="mt-1.5 font-bold text-gray-900 text-title-sm dark:text-white">
              {loading ? "..." : metrics.enTransito}
            </h4>
          </div>
          <Badge color="info">En curso</Badge>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-xl dark:bg-success-500/10">
          <CheckCircle2 className="text-success-600 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Entregados</span>
            <h4 className="mt-1.5 font-bold text-gray-900 text-title-sm dark:text-white">
              {loading ? "..." : metrics.entregados}
            </h4>
          </div>
          <Badge color="success">Completados</Badge>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-warning-50 rounded-xl dark:bg-warning-500/10">
          <AlertTriangle className="text-warning-600 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Observados</span>
            <h4 className="mt-1.5 font-bold text-gray-900 text-title-sm dark:text-white">
              {loading ? "..." : metrics.observados}
            </h4>
          </div>
          <Badge color="warning">Atención</Badge>
        </div>
      </div>

    </div>
  );
};
