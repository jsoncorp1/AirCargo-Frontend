import type { Metadata } from "next";
import React from "react";
import LogisticsMetricTiles from "../_components/logistics/LogisticsMetricTiles";
import DeliveryStatisticsChart from "../_components/logistics/DeliveryStatisticsChart";
import TrackingDeliveryCard from "../_components/logistics/TrackingDeliveryCard";
import OnRouteVehiclesCard from "../_components/logistics/OnRouteVehiclesCard";
import DeliveryActivitiesTable from "../_components/logistics/DeliveryActivitiesTable";

export const metadata: Metadata = {
  title: "Logistics | Plantilla AirCargo",
  description:
    "Dashboard de logística recreado con los componentes de la versión free de TailAdmin.",
};

export default function LogisticsDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Logistics Dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Recreación del dashboard de logística de TailAdmin PRO, armada con los
          componentes que ya vienen en la versión free instalada (Badge, Table,
          Pagination, Dropdown y ApexCharts). Código propio, con datos de
          ejemplo.
        </p>
      </div>

      <LogisticsMetricTiles />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8">
          <DeliveryStatisticsChart />
        </div>
        <div className="col-span-12 flex flex-col gap-4 md:gap-6 xl:col-span-4">
          <OnRouteVehiclesCard />
          <TrackingDeliveryCard />
        </div>
      </div>

      <DeliveryActivitiesTable />
    </div>
  );
}
