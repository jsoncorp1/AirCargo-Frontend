import React from "react";
import { Metadata } from "next";
import CotizadorView from "@/components/pricing/CotizadorView";

export const metadata: Metadata = {
  title: "Cotizador | AirCargo",
  description: "Precio de un envío según la tarifa vigente. No guarda nada.",
};

export default function CotizadorPage() {
  return <CotizadorView />;
}
