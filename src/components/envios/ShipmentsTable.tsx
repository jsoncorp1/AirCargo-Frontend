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
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import { EyeIcon, PencilIcon, TrashBinIcon, BoxCubeIcon, TaskIcon } from "@/icons";
import {
  ShipmentPaginatedItem,
  shipmentService,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_BADGE,
  SHIPMENT_OBSERVATION_LABELS,
} from "@/services/shipmentService";
import ShipmentForm from "./ShipmentForm";
import ShipmentStatusModal from "./ShipmentStatusModal";

type FormMode = "create" | "edit" | "view";

interface ShipmentsTableProps {
  shipments: ShipmentPaginatedItem[];
  orderTotals: Record<string, number>;
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDataChange: () => void;
  onNewShipment: () => void;
  onEditShipment: (id: string) => void;
  onViewShipment: (id: string) => void;
  onStatusShipment: (id: string) => void;
}

function SkeletonRow() {
  return (
    <TableRow>
      {[28, 24, 48, 24, 20, 24, 28, 28, 32].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function ShipmentsTable({
  shipments,
  orderTotals,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  onDataChange,
  onNewShipment,
  onEditShipment,
  onViewShipment,
  onStatusShipment,
}: ShipmentsTableProps) {
  const { showToast } = useToast();
  const deleteModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const askDelete = useCallback(
    (id: string) => {
      setSelectedId(id);
      deleteModal.openModal();
    },
    [deleteModal]
  );

  const { pending: deleting, run: runDelete } = useSubmitLock();

  const handleDelete = () =>
    runDelete(async () => {
      if (!selectedId) return;
      try {
        await shipmentService.deleteShipment(selectedId);
        showToast("success", "Envío eliminado", "El envío ha sido eliminado exitosamente.");
        deleteModal.closeModal();
        onDataChange();
      } catch (err: any) {
        showToast("error", "Error al eliminar", err.message || "No se pudo eliminar el envío.");
      }
    });

  const selectedBasic = shipments.find(s => s.id === selectedId);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Fecha
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Guía
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cliente
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Ruta
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Peso (kg)
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
                  <TableCell className="px-5 py-16 text-center" colSpan={9}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <BoxCubeIcon className="size-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No hay envíos registrados
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Crea envíos vinculándolos a las órdenes de entrega.
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
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(shipment.createdAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                      </p>
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

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">
                      {shipment.originBranchOfficeCode || shipment.destinationBranchOfficeCode ? (
                        <span className="whitespace-nowrap">
                          {shipment.originBranchOfficeCode ?? "—"} &rarr; {shipment.destinationBranchOfficeCode ?? "—"}
                        </span>
                      ) : (
                        <span className="italic text-gray-300 dark:text-gray-600">—</span>
                      )}
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

                    <TableCell className="px-5 py-4 font-medium text-gray-700 text-theme-sm dark:text-gray-300">
                      {shipment.totalWeight} kg
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
                          onClick={() => onStatusShipment(shipment.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-warning-50 hover:text-warning-600 dark:hover:bg-warning-500/10 dark:hover:text-orange-400 transition-colors"
                          title="Cambiar estado / observar"
                        >
                          <TaskIcon className="size-4 shrink-0" /> Estado
                        </button>
                        <button
                          onClick={() => onViewShipment(shipment.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="size-4 shrink-0" /> Ver
                        </button>
                        <button
                          onClick={() => onEditShipment(shipment.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="size-4 shrink-0" /> Editar
                        </button>
                        <button
                          onClick={() => askDelete(shipment.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-error-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                          title="Eliminar"
                        >
                          <TrashBinIcon className="size-4 shrink-0" /> Eliminar
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
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        className="max-w-[420px] m-4 z-50"
      >
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-500/10">
            <TrashBinIcon className="size-6 text-error-500" />
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Eliminar Envío
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás segura de eliminar este envío?
          </p>
          {selectedBasic && (
            <div className="mb-5 mt-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/40">
              <p className="font-medium text-gray-800 dark:text-white">Guía: {selectedBasic.code}</p>
              <p className="text-gray-500">Cliente: {selectedBasic.clientFullName}</p>
            </div>
          )}
          <p className="mb-6 text-xs text-error-500">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={deleteModal.closeModal}
              disabled={deleting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-error-500 px-4 py-2 text-sm font-semibold text-white hover:bg-error-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Eliminando…" : "Sí, eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
