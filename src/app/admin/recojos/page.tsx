import React from "react";
import { Metadata } from "next";
import RecojosView from "@/components/recojos/RecojosView";

export const metadata: Metadata = {
  title: "Solicitudes de Recojo | AirCargo",
  description: "Agenda de recojos de tu sucursal: confirmar, asignar conductor y recibir.",
};

export default function AdminRecojosPage() {
  return <RecojosView perfil="mostrador" />;
}
