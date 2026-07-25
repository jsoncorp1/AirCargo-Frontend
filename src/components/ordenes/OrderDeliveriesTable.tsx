"use client";

import React, { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon, BoxCubeIcon } from "@/icons";
import {
  OrderDeliveryPaginatedItem,
  orderDeliveryService,
} from "@/services/orderDeliveryService";
import OrderDeliveryForm from "./OrderDeliveryForm";

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  Prepaid: "Pagada",
  CashOnDelivery: "Por Pagar",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  Corporate: "Corporativa",
  Sporadic: "Esporádica",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FormMode = "create" | "edit" | "view";

interface OrderDeliveriesTableProps {
  orders: OrderDeliveryPaginatedItem[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDataChange: () => void;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[24, 60, 48, 24, 32, 28, 20, 32].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderDeliveriesTable({
  orders,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  onDataChange,
}: OrderDeliveriesTableProps) {
  const { showToast } = useToast();
  const formModal = useModal();
  const deleteModal = useModal();

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

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
      await orderDeliveryService.deleteDelivery(selectedId);
      showToast("success", "Orden eliminada", "El registro ha sido eliminado exitosamente.");
      deleteModal.closeModal();
      onDataChange();
    } catch (error: unknown) {
      showToast("error", "Error al eliminar", error instanceof Error ? error.message : "No se pudo eliminar la orden.");
    }
  };

  const selectedOrderBasic = orders.find(o => o.id === selectedId);

  // ── Render ────────────────────────────────────────────────────────────────

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
          Nueva Orden de Entrega
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Fecha
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cliente / Destino
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Proveedor
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Origen
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tipo Entrega
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Total
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-16 text-center" colSpan={8}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <BoxCubeIcon className="size-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No hay órdenes registradas
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Crea la primera orden de entrega para tus clientes.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("es-BO")}
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.clientFullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.destinationDepartment}
                      </p>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <span className="text-theme-sm text-gray-600 dark:text-gray-300">
                        {order.supplierName ?? "Cliente esporádico"}
                      </span>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={order.orderType === "Sporadic" ? "info" : "primary"}>
                        {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge size="sm" color={order.deliveryType === "Prepaid" ? "success" : "warning"}>
                          {DELIVERY_TYPE_LABELS[order.deliveryType] ?? order.deliveryType}
                        </Badge>
                        {order.isExpress && (
                          <Badge size="sm" color="error">Expreso</Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                      Bs {order.totalPrice.toFixed(2)}
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={order.isAttended ? "success" : "light"}>
                        {order.isAttended ? "Atendida" : "Pendiente"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openView(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="size-4 shrink-0" /> Ver
                        </button>
                        {order.orderType !== "Sporadic" && (
                          <button
                            onClick={() => openEdit(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="size-4 shrink-0" /> Editar
                          </button>
                        )}
                        <button
                          onClick={() => askDelete(order.id)}
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

      {/* Form Modal */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.closeModal}
        className="max-w-[700px] m-4 z-50"
      >
        {formModal.isOpen && (
          <OrderDeliveryForm
            key={selectedId ?? "new"}
            mode={formMode}
            orderId={selectedId}
            onClose={formModal.closeModal}
            onSaved={onDataChange}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
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
            Eliminar Orden de Entrega
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás segura de eliminar esta orden?
          </p>
          {selectedOrderBasic && (
            <div className="mb-5 mt-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/40">
              <p className="font-medium text-gray-800 dark:text-white">Cliente: {selectedOrderBasic.clientFullName}</p>
              <p className="text-gray-500">Destino: {selectedOrderBasic.destinationDepartment}</p>
            </div>
          )}
          <p className="mb-6 text-xs text-error-500">Esta acción no se puede deshacer y puede afectar los envíos asociados.</p>
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
