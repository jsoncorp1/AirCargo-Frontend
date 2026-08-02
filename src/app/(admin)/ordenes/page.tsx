"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrderDeliveriesTable from "@/components/ordenes/OrderDeliveriesTable";

export default function OrdenesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Órdenes de Entrega" />
      <div className="space-y-6">
        <OrderDeliveriesTable />
      </div>
    </div>
  );
}
