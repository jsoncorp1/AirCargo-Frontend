"use client";

import React, { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import { EyeIcon, BoxCubeIcon } from "@/icons";
import { ShipmentPaginatedItem } from "@/services/shipmentService";
import ShipmentForm from "@/components/envios/ShipmentForm";
import { formatDate, formatTime } from "@/utils/datetime";

interface SupplierShipmentsTableProps {
  shipments: ShipmentPaginatedItem[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

function SkeletonRow() {
  return (
    <TableRow>
      {[6, 24, 40, 24, 20, 16].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function SupplierShipmentsTable({
  shipments,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
}: SupplierShipmentsTableProps) {
  // `?envio={id}` abre ese envío al entrar. Lo usa el botón "Ver envío" del
  // detalle de la orden, que necesita apuntar a un envío puntual y no al
  // listado entero. Va como estado inicial y no como efecto: así no hay un
  // render con el modal cerrado antes de abrirlo, y cerrarlo no lo reabre.
  const requestedId = useSearchParams().get("envio");

  const viewModal = useModal(Boolean(requestedId));
  const [selectedId, setSelectedId] = useState<string | null>(requestedId);

  const rowOffset = (currentPage - 1) * (perPage ?? shipments.length);

  const openView = useCallback(
    (id: string) => {
      setSelectedId(id);
      viewModal.openModal();
    },
    [viewModal]
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="w-14 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Nro
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <span title="Fecha y hora en que se atendió la orden y se emitió la guía del envío">
                    Guía Emitida
                  </span>
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cliente
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Destino
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Costo Envío
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-16 text-center" colSpan={6}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <BoxCubeIcon className="size-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No hay envíos registrados
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((shipment, index) => (
                  <TableRow
                    key={shipment.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Correlativo de la vista, no del envío: sigue contando
                        entre páginas para que la fila 11 sea la 11 y no la 1. */}
                    <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                      {rowOffset + index + 1}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 align-middle text-theme-sm">
                      <p className="font-medium text-gray-800 dark:text-gray-300">
                        {formatDate(shipment.createdAt)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(shipment.createdAt)}
                      </p>
                    </TableCell>

                    <TableCell className="px-5 py-4 align-middle">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {shipment.clientFullName}
                      </p>
                      <span className="mt-0.5 block font-mono text-xs text-gray-500 dark:text-gray-400">
                        {shipment.code}
                      </span>
                    </TableCell>

                    <TableCell className="px-5 py-4 align-middle text-theme-sm text-gray-600 dark:text-gray-300">
                      {shipment.destinationBranchOfficeCode || "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle text-gray-600 text-theme-sm tabular-nums dark:text-gray-300">
                      Bs {shipment.shippingPrice.toFixed(2)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openView(shipment.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="size-4 shrink-0" /> Ver
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            perPage={perPage}
            onPerPageChange={onPerPageChange}
          />
        </div>
      </div>

      <Modal
        isOpen={viewModal.isOpen}
        onClose={viewModal.closeModal}
        className="max-w-[700px] m-4 z-50"
      >
        {viewModal.isOpen && (
          <ShipmentForm
            key={selectedId ?? "view"}
            mode="view"
            shipmentId={selectedId}
            onClose={viewModal.closeModal}
            onSaved={() => {}}
          />
        )}
      </Modal>
    </>
  );
}
