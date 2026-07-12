import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ArticulosTable from "@/components/proveedores/articulos/ArticulosTable";

export const metadata: Metadata = {
  title: "Artículos | AirCargo",
  description: "Gestión de artículos de las empresas proveedoras",
};

export default function ArticulosPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Artículos" />
      <div className="space-y-6">
        <ComponentCard title="Artículos">
          <Suspense fallback={null}>
            <ArticulosTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
