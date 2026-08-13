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
import {
  shipmentService,
  ShipmentPaginatedItem,
  shipmentStatusLabel,
  shipmentStatusBadge,
} from "@/services/shipmentService";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import ShipmentForm from "@/components/envios/ShipmentForm";

export default function EnviosRecientes() {
  const [envios, setEnvios] = useState<ShipmentPaginatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const viewModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openView = (id: string) => {
    setSelectedId(id);
    viewModal.openModal();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Traer los últimos 5
        const res = await shipmentService.getShipments(1, 5);
        setEnvios(res.data);
      } catch (err) {
        console.error("Error fetching recent shipments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/50 dark:bg-gray-800/50">
            <TableRow>
              <TableCell isHeader className="py-3 font-semibold text-gray-500 text-start text-theme-xs dark:text-gray-400">Guía / Código</TableCell>
              <TableCell isHeader className="py-3 font-semibold text-gray-500 text-start text-theme-xs dark:text-gray-400">Cliente</TableCell>
              <TableCell isHeader className="py-3 font-semibold text-gray-500 text-start text-theme-xs dark:text-gray-400">Destino</TableCell>
              <TableCell isHeader className="py-3 font-semibold text-gray-500 text-start text-theme-xs dark:text-gray-400">Monto</TableCell>
              <TableCell isHeader className="py-3 font-semibold text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
              <TableCell isHeader className="py-3 font-semibold text-gray-500 text-start text-theme-xs dark:text-gray-400">Acción</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">Cargando...</TableCell>
              </TableRow>
            ) : envios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">No hay envíos recientes</TableCell>
              </TableRow>
            ) : (
              envios.map((envio) => (
                <TableRow key={envio.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="py-3">
                    <p className="font-mono text-theme-sm font-semibold text-brand-600 dark:text-brand-400">
                      {envio.waybillNumber}
                    </p>
                    <span className="text-gray-400 text-theme-xs dark:text-gray-500">
                      {envio.code}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {envio.clientFullName}
                    </p>
                    <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                      {new Date(envio.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-gray-600 font-medium text-theme-sm dark:text-gray-300">
                    {envio.destinationBranchOfficeCode || "N/A"}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 font-semibold text-theme-sm dark:text-white/90">
                    Bs {envio.shippingPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={shipmentStatusBadge(envio.status)}>
                      {shipmentStatusLabel(envio.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <button onClick={() => openView(envio.id)} className="text-gray-400 hover:text-brand-500 transition-colors" title="Ver detalle">
                      <Eye className="w-5 h-5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={viewModal.isOpen} onClose={viewModal.closeModal} className="max-w-[700px] m-4 z-50">
        {viewModal.isOpen && (
          <ShipmentForm
            mode="view"
            shipmentId={selectedId}
            onClose={viewModal.closeModal}
            onSaved={() => {}}
          />
        )}
      </Modal>
    </div>
  );
}
