import { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import EnviosTable from "@/components/envios/EnviosTable";

export const metadata: Metadata = {
  title: "Envíos Logísticos | AirCargo",
  description: "Gestión de envíos y paquetes de la plataforma",
};

export default function EnviosPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Envíos Logísticos" />
      <EnviosTable />
    </div>
  );
}
