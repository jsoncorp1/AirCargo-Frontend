"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

const MOCK_LIQUIDACIONES = [
  { id: 1, conductor: "Juan Pérez", sucursal: "Santa Cruz", monto: 1250.50, envios: 15, fecha: "2024-05-10", estado: "Pendiente" },
  { id: 2, conductor: "Carlos Gómez", sucursal: "Santa Cruz", monto: 850.00, envios: 8, fecha: "2024-05-09", estado: "Pagado" },
  { id: 3, conductor: "Miguel Suárez", sucursal: "La Paz", monto: 2100.00, envios: 22, fecha: "2024-05-08", estado: "Pagado" },
];

export default function AdminLiquidacionesPage() {
  const [pagando, setPagando] = useState<number | null>(null);

  const handlePagar = (id: number) => {
    setPagando(id);
    setTimeout(() => {
      setPagando(null);
      alert("Liquidación marcada como pagada.");
    }, 1000);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Liquidaciones de Conductores" />

      <div className="mb-6">
        <p className="text-gray-500 text-sm dark:text-gray-400">Revisa los saldos pendientes de los conductores generados por entregas "Por Pagar" (COD).</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800/40">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fecha de Corte</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Conductor</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Sucursal</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Cant. Envíos</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Monto a Rendir</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Estado</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 text-right">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {MOCK_LIQUIDACIONES.map((liq) => (
              <TableRow key={liq.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{liq.fecha}</TableCell>
                <TableCell className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{liq.conductor}</TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{liq.sucursal}</TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{liq.envios}</TableCell>
                <TableCell className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white">Bs {liq.monto.toFixed(2)}</TableCell>
                <TableCell className="px-5 py-3 text-sm">
                  <Badge size="sm" color={liq.estado === "Pendiente" ? "warning" : "success"}>
                    {liq.estado}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3 text-right">
                  {liq.estado === "Pendiente" ? (
                    <button 
                      onClick={() => handlePagar(liq.id)}
                      disabled={pagando === liq.id}
                      className="text-xs bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      {pagando === liq.id ? "Procesando..." : "Marcar Pagado"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Completado</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
