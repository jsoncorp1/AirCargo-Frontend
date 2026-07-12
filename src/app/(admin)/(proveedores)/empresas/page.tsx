import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import EmpresasTable from "@/components/proveedores/empresas/EmpresasTable";

export const metadata: Metadata = {
  title: "Empresas Proveedoras | AirCargo",
  description: "Gestión de empresas proveedoras",
};

export default function EmpresasPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Empresas Proveedoras" />
      <div className="space-y-6">
        <ComponentCard title="Empresas">
          <Suspense fallback={null}>
            <EmpresasTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
