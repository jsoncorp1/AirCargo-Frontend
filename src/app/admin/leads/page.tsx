"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

const MOCK_LEADS = [
  { id: 1, date: "2024-05-10 10:30", company: "Tienda Moda SA", contact: "María López", city: "Santa Cruz", phone: "+591 71234567", email: "maria@moda.com", status: "Nuevo" },
  { id: 2, date: "2024-05-09 15:20", company: "ElectroFast", contact: "Carlos Gómez", city: "La Paz", phone: "+591 61234567", email: "carlos@electro.com", status: "Contactado" },
  { id: 3, date: "2024-05-08 09:15", company: "Zapatos Express", contact: "Ana Suárez", city: "Cochabamba", phone: "+591 79876543", email: "ana@zapatos.com", status: "Cerrado (Éxito)" },
];

export default function AdminLeadsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Se descargó el archivo leads_aircargo.xlsx");
    }, 1000);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Clientes Potenciales (Leads)" />

      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm dark:text-gray-400">Estos son los usuarios que solicitaron servicio desde la Landing Page.</p>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isExporting ? "Generando Excel..." : "Exportar a Excel"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800/40">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fecha</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Compañía</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Contacto</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Ciudad</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Teléfono</TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Estado</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {MOCK_LEADS.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{lead.date}</TableCell>
                <TableCell className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{lead.company}</TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{lead.contact}<br/><span className="text-xs text-gray-400">{lead.email}</span></TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{lead.city}</TableCell>
                <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">{lead.phone}</TableCell>
                <TableCell className="px-5 py-3 text-sm">
                  <Badge size="sm" color={lead.status === "Nuevo" ? "warning" : lead.status === "Contactado" ? "brand" : "success"}>
                    {lead.status}
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
