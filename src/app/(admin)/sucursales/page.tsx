"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SucursalesTable from "@/components/sucursales/SucursalesTable";

export default function SucursalesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Sucursales" />
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Administración de Sucursales
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gestiona las sucursales de la empresa distribuidas en todo el país.
        </p>
      </div>
      <SucursalesTable />
    </div>
  );
}
