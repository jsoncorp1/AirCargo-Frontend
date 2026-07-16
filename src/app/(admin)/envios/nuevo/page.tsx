import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WizardNuevoEnvio from "@/components/envios/WizardNuevoEnvio";

export const metadata: Metadata = {
  title: "Nuevo Envío | AirCargo",
  description: "Crear un nuevo envío interdepartamental",
};

export default function NuevoEnvioPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Crear Nuevo Envío" />
      <div className="space-y-6">
        <Suspense fallback={<div className="p-10 text-center">Cargando asistente...</div>}>
          <WizardNuevoEnvio />
        </Suspense>
      </div>
    </div>
  );
}
