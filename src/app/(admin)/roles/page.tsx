"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RolesTable from "@/components/roles/RolesTable";

export default function RolesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Roles" />
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Administración de Roles
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gestiona los diferentes roles del sistema y sus permisos para controlar el acceso a la plataforma.
        </p>
      </div>
      <RolesTable />
    </div>
  );
}
