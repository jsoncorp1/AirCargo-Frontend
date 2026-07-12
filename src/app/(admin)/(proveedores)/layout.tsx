"use client";

import React from "react";
import { ProveedoresProvider } from "@/context/ProveedoresContext";

export default function ProveedoresLayout({ children }: { children: React.ReactNode }) {
  return <ProveedoresProvider>{children}</ProveedoresProvider>;
}
