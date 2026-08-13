import { Metadata } from "next";
import React from "react";
import RepartoView from "@/components/reparto/RepartoView";

export const metadata: Metadata = {
  title: "Reparto | AirCargo",
  description: "Asignación de envíos a conductores",
};

export default function RepartoPage() {
  return <RepartoView />;
}
