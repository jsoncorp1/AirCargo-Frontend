import React from "react";
import { Metadata } from "next";
import CuentaCorrienteView from "@/components/cuentacorriente/CuentaCorrienteView";

export const metadata: Metadata = {
  title: "Estado de Cuenta | AirCargo",
  description: "Los envíos que se cargaron a tu cuenta corriente, agrupados por mes.",
};

export default function ProveedorCuentaCorrientePage() {
  return <CuentaCorrienteView perfil="empresa" />;
}
