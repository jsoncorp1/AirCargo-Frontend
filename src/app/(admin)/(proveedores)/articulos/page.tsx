import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ArticulosTable from "@/components/articulos/ArticulosTable";

export const metadata: Metadata = {
  title: "Catálogo de Artículos | AirCargo",
  description: "Gestión del inventario de artículos de los proveedores",
};

export default function ArticulosPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Catálogo de Artículos" />
      <div className="space-y-6">
        <ArticulosTable />
      </div>
    </div>
  );
}
