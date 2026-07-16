"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Envio } from "@/data/mock/envios";
import { envioService } from "@/services/envioService";
import { Empresa } from "@/data/mock/empresas";
import { empresaService } from "@/services/empresaService";
import Link from "next/link";

export default function EnviosRecientes() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, Empresa>>({});

  useEffect(() => {
    const fetchData = async () => {
      const enviosData = await envioService.getEnvios();
      const empresasData = await empresaService.getEmpresas();
      
      const empMap: Record<string, Empresa> = {};
      empresasData.forEach(e => empMap[e.id] = e);
      
      setEmpresas(empMap);
      setEnvios(enviosData.slice(0, 5)); // Solo los 5 más recientes
    };
    fetchData();
  }, []);

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "Entregado": return "success";
      case "En Camino": return "warning";
      case "Pendiente": return "error";
      case "Asignado": return "info";
      default: return "light";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Envíos Recientes
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/envios" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            Ver Todos
          </Link>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID Envío</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Empresa Origen</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Destino</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Monto</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {envios.map((envio) => (
              <TableRow key={envio.id}>
                <TableCell className="py-3 font-mono text-theme-sm text-brand-500">
                  {envio.id}
                </TableCell>
                <TableCell className="py-3">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {empresas[envio.empresaId]?.nombre || "Desconocida"}
                  </p>
                  <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                    {new Date(envio.fechaCreacion).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {envio.departamentoDestino}
                </TableCell>
                <TableCell className="py-3 text-gray-800 font-medium text-theme-sm dark:text-white/90">
                  Bs {envio.costoTotal}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge size="sm" color={getBadgeColor(envio.estado) as any}>
                    {envio.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
