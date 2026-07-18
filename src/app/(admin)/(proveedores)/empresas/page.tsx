import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import EmpresasTable from "@/components/proveedores/empresas/EmpresasTable";

export const metadata: Metadata = {
  title: "Proveedores | AirCargo",
  description: "Gestión de proveedores",
};

export default function EmpresasPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Proveedores" />
      <div className="space-y-6">
        <ComponentCard title="Proveedores">
          <Suspense fallback={null}>
            <EmpresasTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
