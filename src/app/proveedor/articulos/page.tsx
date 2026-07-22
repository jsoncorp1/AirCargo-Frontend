import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import SupplierArticulosTable from "@/components/proveedor/SupplierArticulosTable";

export const metadata: Metadata = {
  title: "Artículos | AirCargo",
  description: "Artículos disponibles de tu empresa",
};

export default function ProveedorArticulosPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Artículos" />
      <div className="space-y-6">
        <ComponentCard title="Mis Artículos">
          <Suspense fallback={null}>
            <SupplierArticulosTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
