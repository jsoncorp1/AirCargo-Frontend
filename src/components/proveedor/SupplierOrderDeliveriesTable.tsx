"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
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
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon, BoxCubeIcon } from "@/icons";
import {
  AttentionStatus,
  OrderDeliveryPaginatedItem,
  orderDeliveryService,
} from "@/services/orderDeliveryService";
import {
  ATTENTION_DATE_HEADERS,
  attentionDate,
} from "@/utils/orderAttentionDate";
import { isOrderOwner } from "@/utils/orderOwnership";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage, isConcurrencyConflict } from "@/services/apiErrorMessages";
import { withConcurrencyRetry } from "@/services/withConcurrencyRetry";
import { formatDate, formatTime } from "@/utils/datetime";

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  Prepaid: "Pagada",
  CashOnDelivery: "Por Pagar",
};

interface SupplierOrderDeliveriesTableProps {
  orders: OrderDeliveryPaginatedItem[];
  // Pestaña activa: define qué fecha muestra la columna y con qué encabezado.
  attentionStatus: AttentionStatus;
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDataChange: () => void;
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

export default function SupplierOrderDeliveriesTable({
  orders,
  attentionStatus,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  onDataChange,
}: SupplierOrderDeliveriesTableProps) {
  const { showToast } = useToast();
  // Editar y eliminar quedan reservados a quien creó cada orden.
  const { user } = useAuth();
  const userEmail = user?.email;
  const deleteModal = useModal();

  // Cuántas filas quedaron atrás en las páginas anteriores.
  const rowOffset = (currentPage - 1) * (perPage ?? orders.length);

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

      // El autor se comprueba contra el DETALLE, no contra la fila del listado:
      // `OrderDeliveryPaginatedItem` todavía no trae `createdBy`, así que la
      // fila no alcanza para saber de quién es. Es un GET de más antes de una
      // operación irreversible, y hasta que el listado traiga el campo es la
      // única forma de cerrarlo desde el front.
      try {
        const target = await orderDeliveryService.getDeliveryById(selectedId);
        if (!isOrderOwner(target, userEmail)) {
          showToast(
            "error",
            "No se puede eliminar",
            "Solo quien creó esta orden puede eliminarla."
          );
          deleteModal.closeModal();
          onDataChange();
          return;
        }
      } catch (error: unknown) {
        showToast(
          "error",
          "Error al eliminar",
          getApiErrorMessage(error, "No se pudo verificar la orden.")
        );
        return;
      }

      try {
        // Eliminar devuelve el stock al artículo: mismo token de concurrencia,
        // mismo 409 sin cambios guardados. Reintentar no borra dos veces.
        await withConcurrencyRetry(() => orderDeliveryService.deleteDelivery(selectedId));
        showToast("success", "Orden eliminada", "El registro ha sido eliminado exitosamente.");
        deleteModal.closeModal();
        onDataChange();
      } catch (error: unknown) {
        showToast(
          "error",
          isConcurrencyConflict(error) ? "Conflicto de concurrencia" : "Error al eliminar",
          getApiErrorMessage(error, "No se pudo eliminar la orden.")
        );
        if (isConcurrencyConflict(error)) onDataChange();
      }
    });

  const selectedOrderBasic = orders.find(o => o.id === selectedId);

  return (
    <>
      <div className="flex justify-end mb-4">
        {/* Crear tiene ruta propia: el formulario es largo y en modal quedaba
            apretado. Ver y editar siguen en modal, que son consultas cortas. */}
        <Link
          href="/proveedor/ordenes/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 active:bg-brand-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Orden de Entrega
        </Link>
      </div>

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
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Crea la primera orden de entrega para tus clientes.
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
                        <Badge size="sm" color={order.deliveryType === "Prepaid" ? "success" : "warning"}>
                          {DELIVERY_TYPE_LABELS[order.deliveryType] ?? order.deliveryType}
                        </Badge>
                        {order.isExpress && (
                          <Badge size="sm" color="error">Expreso</Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle font-semibold text-gray-800 text-theme-sm tabular-nums dark:text-white/90">
                      Bs {order.totalPrice.toFixed(2)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver y editar tienen ruta propia, igual que crear: el
                            detalle y el formulario son largos y en modal
                            obligaban a scrollear dentro de una caja. */}
                        <Link
                          href={`/proveedor/ordenes/${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="size-4 shrink-0" /> Ver
                        </Link>
                        {/* Dos motivos para no ofrecer estas acciones:
                            - la orden ya se convirtió en envío, y el backend
                              rechaza editarla o borrarla;
                            - la creó otro usuario del proveedor, y solo su
                              autor puede tocarla.
                            En los dos casos el botón no se muestra, en vez de
                            ofrecer algo que va a rebotar. */}
                        {!order.isAttended && isOrderOwner(order, userEmail) && (
                          <>
                            <Link
                              href={`/proveedor/ordenes/${order.id}/editar`}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="size-4 shrink-0" /> Editar
                            </Link>
                            <button
                              onClick={() => askDelete(order.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
                              title="Eliminar"
                            >
                              <TrashBinIcon className="size-4 shrink-0" /> Eliminar
                            </button>
                          </>
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
