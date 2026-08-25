import { Metadata } from "next";
import React from "react";
import LeadsView from "@/components/leads/LeadsView";

export const metadata: Metadata = {
  title: "Clientes Potenciales | AirCargo",
  description: "Solicitudes de información enviadas desde la web",
};

export default function LeadsPage() {
  return <LeadsView />;
}
