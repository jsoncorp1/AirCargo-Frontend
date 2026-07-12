import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import UsuariosTable from "@/components/proveedores/usuarios/UsuariosTable";

export const metadata: Metadata = {
  title: "Usuarios Proveedores | AirCargo",
  description: "Gestión de usuarios proveedores",
};

export default function UsuariosProveedoresPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Usuarios Proveedores" />
      <div className="space-y-6">
        <ComponentCard title="Usuarios">
          <Suspense fallback={null}>
            <UsuariosTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
