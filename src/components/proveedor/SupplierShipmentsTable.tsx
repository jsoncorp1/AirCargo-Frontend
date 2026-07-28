"use client";

import React, { useState, useCallback } from "react";
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
import {
  ShipmentPaginatedItem,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_BADGE,
  SHIPMENT_OBSERVATION_LABELS,
} from "@/services/shipmentService";
import ShipmentForm from "@/components/envios/ShipmentForm";

interface SupplierShipmentsTableProps {
  shipments: ShipmentPaginatedItem[];
  orderTotals: Record<string, number>;
  // Fecha de creación de cada orden, para mostrar cuándo se solicitó el envío
  // además de cuándo se emitió la guía.
  orderDates?: Record<string, string>;
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
      {[28, 24, 48, 24, 28, 28].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function SupplierShipmentsTable({
  shipments,
  orderTotals,
  orderDates,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
}: SupplierShipmentsTableProps) {
  const viewModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <span title="Fecha y hora en que se atendió la orden y se emitió la guía del envío">
                    Guía Emitida
                  </span>
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Guía
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cliente
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Precio Artículos
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                  <TableCell className="px-5 py-16 text-center" colSpan={7}>
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
                shipments.map((shipment) => (
                  <TableRow
                    key={shipment.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="px-5 py-4 text-theme-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        {new Date(shipment.createdAt).toLocaleDateString("es-BO")}
                        <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(shipment.createdAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </p>
                      {orderDates?.[shipment.orderDeliveryId] && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Solicitado: {new Date(orderDates[shipment.orderDeliveryId]).toLocaleDateString("es-BO")}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {shipment.code}
                      </span>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {shipment.clientFullName}
                      </p>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={SHIPMENT_STATUS_BADGE[shipment.status] ?? "light"}>
                        {SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status}
                      </Badge>
                      {shipment.observation && (
                        <p className="mt-1 text-xs text-warning-600 dark:text-orange-400">
                          {SHIPMENT_OBSERVATION_LABELS[shipment.observation] ?? shipment.observation}
                        </p>
                      )}
                    </TableCell>

                    {/* Valor de los artículos de la orden; el costo de envío va
                        en su propia columna y no se suma acá. */}
                    <TableCell className="px-5 py-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                      Bs {(orderTotals[shipment.orderDeliveryId] ?? 0).toFixed(2)}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-gray-600 text-theme-sm dark:text-gray-300">
                      Bs {shipment.shippingPrice.toFixed(2)}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-right">
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
