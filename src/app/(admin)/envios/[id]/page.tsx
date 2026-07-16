import { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TrackingView from "@/components/envios/TrackingView";

export const metadata: Metadata = {
  title: "Tracking de Envío | AirCargo",
  description: "Detalle y seguimiento del envío",
};

export default function TrackingPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Seguimiento de Envío" />
      <div className="space-y-6">
        <TrackingView />
      </div>
    </div>
  );
}
