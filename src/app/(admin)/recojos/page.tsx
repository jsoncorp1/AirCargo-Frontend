import React from "react";
import { Metadata } from "next";
import RecojosView from "@/components/recojos/RecojosView";

export const metadata: Metadata = {
  title: "Solicitudes de Recojo | AirCargo",
  description: "Agenda de recojos: qué hay que salir a buscar y en qué estado está cada solicitud.",
};

export default function RecojosPage() {
  return <RecojosView perfil="mostrador" />;
}
