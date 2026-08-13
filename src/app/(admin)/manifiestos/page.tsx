import { Metadata } from "next";
import React from "react";
import ManifiestosView from "@/components/manifiestos/ManifiestosView";

export const metadata: Metadata = {
  title: "Manifiestos | AirCargo",
  description: "Lotes de transporte entre sucursales",
};

export default function ManifiestosPage() {
  return <ManifiestosView basePath="/manifiestos" />;
}
