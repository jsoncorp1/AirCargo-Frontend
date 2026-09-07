import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CashRegisterView from "@/components/caja/CashRegisterView";

export const metadata: Metadata = {
  title: "Caja | AirCargo",
  description: "El cajón de la sucursal: apertura, cobros, gastos y cierre",
};

export default function AdminCajaPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Caja" />
      <CashRegisterView isSuperAdmin={false} />
    </div>
  );
}
