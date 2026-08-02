"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsuariosTable from "@/components/usuarios/UsuariosTable";

export default function UsuariosPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Usuarios" />
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Administración de Usuarios
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gestiona los usuarios del sistema, sus roles, sucursales y accesos.
        </p>
      </div>
      <UsuariosTable />
    </div>
  );
}
