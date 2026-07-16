import React, { Suspense } from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ConductoresTable from "@/components/conductores/ConductoresTable";

export const metadata: Metadata = {
  title: "Conductores | AirCargo",
  description: "Gestión de conductores de flota",
};

export default function ConductoresPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Conductores" />
      <div className="space-y-6">
        <ComponentCard title="Flota de Conductores">
          <Suspense fallback={null}>
            <ConductoresTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
