import React from "react";
import { Metadata } from "next";
import RecojosView from "@/components/recojos/RecojosView";

export const metadata: Metadata = {
  title: "Mis Recojos | AirCargo",
  description: "Pedí que un conductor pase a buscar un paquete y seguí tus solicitudes.",
};

export default function ProveedorRecojosPage() {
  return <RecojosView perfil="empresa" />;
}
