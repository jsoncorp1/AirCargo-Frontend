import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CashRegisterView from "@/components/caja/CashRegisterView";

export const metadata: Metadata = {
  title: "Supervisión de Cajas | AirCargo",
  description: "Auditoría global de las cajas de todas las sucursales",
};

export default function SuperAdminCajaPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Supervisión de Cajas" />
      <CashRegisterView isSuperAdmin={true} />
    </div>
  );
}
