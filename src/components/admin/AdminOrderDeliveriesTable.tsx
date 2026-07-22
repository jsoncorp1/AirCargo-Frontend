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
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, BoxCubeIcon } from "@/icons";
import { OrderDeliveryPaginatedItem } from "@/services/orderDeliveryService";
import OrderDeliveryForm from "@/components/ordenes/OrderDeliveryForm";

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  Prepaid: "Pagada",
  CashOnDelivery: "Por Pagar",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  Corporate: "Corporativa",
  Sporadic: "Esporádica",
};

interface AdminOrderDeliveriesTableProps {
  orders: OrderDeliveryPaginatedItem[];
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
      {[24, 60, 32, 28, 20, 32].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function AdminOrderDeliveriesTable({
  orders,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
}: AdminOrderDeliveriesTableProps) {
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
                  Fecha
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cliente / Destino
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tipo Orden
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
                  <TableCell className="px-5 py-16 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <BoxCubeIcon className="size-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No hay órdenes registradas
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
                        {order.department}
                      </p>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={order.orderType === "Sporadic" ? "info" : "primary"}>
                        {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={order.deliveryType === "Prepaid" ? "success" : "warning"}>
                        {DELIVERY_TYPE_LABELS[order.deliveryType] ?? order.deliveryType}
                      </Badge>
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
          <OrderDeliveryForm
            key={selectedId ?? "view"}
            mode="view"
            orderId={selectedId}
            onClose={viewModal.closeModal}
            onSaved={() => {}}
          />
        )}
      </Modal>
    </>
  );
}
