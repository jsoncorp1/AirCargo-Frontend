import React from "react";
import { Metadata } from "next";
import LiquidacionesView from "@/components/liquidaciones/LiquidacionesView";

export const metadata: Metadata = {
  title: "Liquidaciones de Conductores | AirCargo",
  description: "Lo que la sucursal le debe a cada conductor por sus tareas cerradas.",
};

export default function AdminLiquidacionesPage() {
  return <LiquidacionesView perfil="admin" />;
}
