import React from "react";
import { Metadata } from "next";
import LiquidacionesView from "@/components/liquidaciones/LiquidacionesView";

export const metadata: Metadata = {
  title: "Mis Liquidaciones | AirCargo",
  description: "Tu recibo del mes: la suma de las comisiones de las tareas que cerraste.",
};

export default function ConductorLiquidacionesPage() {
  return <LiquidacionesView perfil="conductor" />;
}
