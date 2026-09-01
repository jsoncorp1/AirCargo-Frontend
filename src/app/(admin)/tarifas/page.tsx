import React from "react";
import { Metadata } from "next";
import TarifasView from "@/components/tarifas/TarifasView";

export const metadata: Metadata = {
  title: "Tarifas | AirCargo",
  description: "Tarifario de flete, servicio a domicilio y comisiones a conductores.",
};

export default function TarifasPage() {
  return <TarifasView />;
}
