import React from "react";
import { Metadata } from "next";
import PerfilesConductorView from "@/components/conductores/PerfilesConductorView";

export const metadata: Metadata = {
  title: "Perfiles de Conductor | AirCargo",
  description: "Vehículo y modalidad de cada conductor. Sin perfil no se le pueden asignar tareas.",
};

export default function PerfilesConductorPage() {
  return <PerfilesConductorView />;
}
