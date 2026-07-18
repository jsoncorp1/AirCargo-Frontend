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
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon, BoxCubeIcon } from "@/icons";
import {
  ShipmentPaginatedItem,
  shipmentService,
} from "@/services/shipmentService";
import ShipmentForm from "./ShipmentForm";

type FormMode = "create" | "edit" | "view";

interface ShipmentsTableProps {
  shipments: ShipmentPaginatedItem[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDataChange: () => void;
}

function SkeletonRow() {
  return (
    <TableRow>
      {[48, 56, 32, 32, 28, 32].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function ShipmentsTable({
  shipments,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  onDataChange,
}: ShipmentsTableProps) {
  const { showToast } = useToast();
  const formModal = useModal();
  const deleteModal = useModal();

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setSelectedId(null);
    setFormMode("create");
    formModal.openModal();
  }, [formModal]);

  const openView = useCallback(
    (id: string) => {
      setSelectedId(id);
      setFormMode("view");
      formModal.openModal();
    },
    [formModal]
  );

  const openEdit = useCallback(
    (id: string) => {
      setSelectedId(id);
      setFormMode("edit");
      formModal.openModal();
    },
    [formModal]
  );

  const askDelete = useCallback(
    (id: string) => {
      setSelectedId(id);
      deleteModal.openModal();
    },
    [deleteModal]
  );

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await shipmentService.deleteShipment(selectedId);
      showToast("success", "Envío eliminado", "El envío ha sido eliminado exitosamente.");
      deleteModal.closeModal();
      onDataChange();
    } catch (err: any) {
      showToast("error", "Error al eliminar", err.message || "No se pudo eliminar el envío.");
    }
  };

  const selectedBasic = shipments.find(s => s.id === selectedId);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 active:bg-brand-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Envío
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Guía
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cliente
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Peso (kg)
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Costo Envío
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Fecha
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
                    <TableCell className="px-5 py-4">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {shipment.waybillNumber}
                      </span>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {shipment.clientFullName}
                      </p>
                    </TableCell>

                    <TableCell className="px-5 py-4 font-medium text-gray-700 text-theme-sm dark:text-gray-300">
                      {shipment.totalWeight} kg
                    </TableCell>

                    <TableCell className="px-5 py-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                      Bs {shipment.shippingPrice.toFixed(2)}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {new Date(shipment.createdAt).toLocaleDateString("es-BO")}
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
                        <button
                          onClick={() => openEdit(shipment.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="size-4 shrink-0" /> Editar
                        </button>
                        <button
                          onClick={() => askDelete(shipment.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
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

        {totalPages > 1 && (
          <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.closeModal}
        className="max-w-[700px] m-4 z-50"
      >
        {formModal.isOpen && (
          <ShipmentForm
            key={selectedId ?? "new"}
            mode={formMode}
            shipmentId={selectedId}
            onClose={formModal.closeModal}
            onSaved={onDataChange}
          />
        )}
      </Modal>

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
              <p className="font-medium text-gray-800 dark:text-white">Guía: {selectedBasic.waybillNumber}</p>
              <p className="text-gray-500">Cliente: {selectedBasic.clientFullName}</p>
            </div>
          )}
          <p className="mb-6 text-xs text-error-500">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={deleteModal.closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-error-500 px-4 py-2 text-sm font-semibold text-white hover:bg-error-600 transition-colors"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
