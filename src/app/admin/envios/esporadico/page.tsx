import { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SporadicShipmentForm from "@/components/envios/SporadicShipmentForm";

export const metadata: Metadata = {
  title: "Envío Esporádico | AirCargo",
  description: "Registrar un envío esporádico de mostrador",
};

export default function AdminEnvioEsporadicoPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Envío Esporádico" />
      <div className="space-y-6">
        <SporadicShipmentForm />
      </div>
    </div>
  );
}
