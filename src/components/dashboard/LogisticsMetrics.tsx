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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Package className="text-brand-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Envíos</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : metrics.totalEnvios}
            </h4>
          </div>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Truck className="text-info-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">En Tránsito</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : metrics.enTransito}
            </h4>
          </div>
          <Badge color="info">En curso</Badge>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <CheckCircle2 className="text-success-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Entregados</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : metrics.entregados}
            </h4>
          </div>
          <Badge color="success">Completados</Badge>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <AlertTriangle className="text-warning-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Observados</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : metrics.observados}
            </h4>
          </div>
          <Badge color="warning">Atención</Badge>
        </div>
      </div>

    </div>
  );
};
