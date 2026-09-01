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
import { paymentTypeLabel, paymentTypeBadge } from "@/services/logisticsEnums";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, BoxCubeIcon, TaskIcon } from "@/icons";
import {
  AttentionStatus,
  OrderDeliveryPaginatedItem,
} from "@/services/orderDeliveryService";
import {
  ATTENTION_DATE_HEADERS,
  attentionDate,
} from "@/utils/orderAttentionDate";
import OrderDeliveryForm from "@/components/ordenes/OrderDeliveryForm";
import ShipmentForm from "@/components/envios/ShipmentForm";
import { formatDate, formatTime } from "@/utils/datetime";

interface AdminOrderDeliveriesTableProps {
  orders: OrderDeliveryPaginatedItem[];
  // Pestaña activa: define qué fecha muestra la columna y con qué encabezado.
  attentionStatus: AttentionStatus;
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  // Se llama al atender una orden, para refrescar el listado.
  onDataChange?: () => void;
}

function SkeletonRow() {
  return (
    <TableRow>
      {[6, 24, 40, 24, 24, 20, 32].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function AdminOrderDeliveriesTable({
  orders,
  attentionStatus,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  onDataChange,
}: AdminOrderDeliveriesTableProps) {
  const viewModal = useModal();
  const attendModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Cuántas filas quedaron atrás en las páginas anteriores.
  const rowOffset = (currentPage - 1) * (perPage ?? orders.length);

  const openView = useCallback(
    (id: string) => {
      setSelectedId(id);
      viewModal.openModal();
    },
    [viewModal]
  );

  const openAttend = useCallback(
    (id: string) => {
      setSelectedId(id);
      attendModal.openModal();
    },
    [attendModal]
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
                  {ATTENTION_DATE_HEADERS[attentionStatus]}
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cliente
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Destino
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tipo de Entrega
                </TableCell>
                <TableCell isHeader className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Total
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
                orders.map((order, index) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Correlativo de la vista, no de la orden: sigue contando
                        entre páginas para que la fila 11 sea la 11 y no la 1. */}
                    <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                      {rowOffset + index + 1}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 align-middle">
                      {(() => {
                        const date = attentionDate(order, attentionStatus);
                        return (
                          <>
                            <p className="text-gray-800 text-theme-sm dark:text-gray-300 font-medium">
                              {formatDate(date.at)}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(date.at)}
                            </p>
                            {/* En "Todas" conviven las dos fechas, así que la
                                fila aclara de cuál está hablando. */}
                            {attentionStatus === "All" && (
                              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                {date.kind === "attended" ? "Atendida" : "Creada"}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </TableCell>

                    <TableCell className="px-5 py-4 align-middle">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.clientFullName}
                      </p>
                      {order.clientPhone ? (
                        <a
                          href={`tel:${order.clientPhone}`}
                          className="mt-0.5 block font-mono text-xs text-gray-500 hover:text-brand-500 dark:text-gray-400"
                        >
                          {order.clientPhone}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-xs text-gray-400">—</p>
                      )}
                    </TableCell>

                    {/* La sucursal va debajo del departamento: es opcional, así
                        que la fila tiene que leerse igual cuando no está. */}
                    <TableCell className="px-5 py-4 align-middle">
                      <p className="text-theme-sm text-gray-600 dark:text-gray-300">
                        {order.destinationDepartment}
                      </p>
                      {order.destinationBranchOfficeCity && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {order.destinationBranchOfficeCity}
                          {order.destinationBranchOfficeCode
                            ? ` — ${order.destinationBranchOfficeCode}`
                            : ""}
                        </p>
                      )}
                    </TableCell>

                    {/* "Expreso" va debajo y no al lado: al lado empujaba el
                        ancho de la columna y desalineaba las filas vecinas. */}
                    <TableCell className="px-5 py-4 align-middle">
                      <div className="flex flex-col items-start gap-1">
                        <Badge size="sm" color={paymentTypeBadge(order.paymentType)}>
                          {paymentTypeLabel(order.paymentType)}
                        </Badge>
                        {order.isExpress && (
                          <Badge size="sm" color="error">Expreso</Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle font-semibold text-gray-800 text-theme-sm tabular-nums dark:text-white/90">
                      Bs {order.totalPrice.toFixed(2)}
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
                        {!order.isAttended && (
                          <button
                            onClick={() => openAttend(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300 transition-colors"
                            title="Atender la orden y generar la guía del envío"
                          >
                            <TaskIcon className="size-4 shrink-0" /> Atender
                          </button>
                        )}
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

      {/* Atender: crea el envío de la orden (queda atendida y aparece en Envíos) */}
      <Modal
        isOpen={attendModal.isOpen}
        onClose={attendModal.closeModal}
        className="max-w-[700px] m-4 z-50"
      >
        {attendModal.isOpen && selectedId && (
          <ShipmentForm
            key={`attend-${selectedId}`}
            mode="create"
            presetOrderDeliveryId={selectedId}
            onClose={attendModal.closeModal}
            onSaved={() => onDataChange?.()}
          />
        )}
      </Modal>
    </>
  );
}
