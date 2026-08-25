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
      {/* Sin `title`: el encabezado de la página ya dice "Artículos" y repetirlo
          dentro de la tarjeta era decir dos veces lo mismo. */}
      <ComponentCard>
        <Suspense fallback={null}>
          <SupplierArticulosTable />
        </Suspense>
      </ComponentCard>
    </div>
  );
}
