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
  );
}
