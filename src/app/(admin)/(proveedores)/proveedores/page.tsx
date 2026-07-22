import React, { Suspense } from "react";
import { Metadata } from "next";
import EmpresasPageContent from "@/components/proveedores/empresas/EmpresasPageContent";

export const metadata: Metadata = {
  title: "Proveedores | AirCargo",
  description: "Gestión de proveedores",
};

export default function EmpresasPage() {
  return (
    <Suspense fallback={null}>
      <EmpresasPageContent />
    </Suspense>
  );
}
