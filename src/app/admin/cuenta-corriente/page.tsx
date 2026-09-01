import React from "react";
import { Metadata } from "next";
import CuentaCorrienteView from "@/components/cuentacorriente/CuentaCorrienteView";

export const metadata: Metadata = {
  title: "Cobranzas | AirCargo",
  description: "Períodos de cuenta corriente de tu alcance: cerrar el mes y registrar el cobro.",
};

export default function AdminCobranzasPage() {
  return <CuentaCorrienteView perfil="cobranzas" />;
}
