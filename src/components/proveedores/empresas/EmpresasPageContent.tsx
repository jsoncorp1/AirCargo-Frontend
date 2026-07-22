"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import EmpresasTable from "./EmpresasTable";

export default function EmpresasPageContent() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Proveedores" />
      <div className="space-y-6">
        <EmpresasTable />
      </div>
    </div>
  );
}
