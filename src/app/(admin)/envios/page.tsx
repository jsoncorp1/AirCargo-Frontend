import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import EnviosTable from "@/components/envios/EnviosTable";

export const metadata: Metadata = {
  title: "Envíos | AirCargo",
  description: "Gestión de envíos y logística",
};

export default function EnviosPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Gestión de Envíos" />
      <div className="space-y-6">
        <ComponentCard title="Listado de Envíos">
          <Suspense fallback={null}>
            <EnviosTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
