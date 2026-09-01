import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { paymentTypeLabel, paymentTypeBadge } from "@/services/logisticsEnums";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon, BoxCubeIcon, TaskIcon } from "@/icons";
import {
  AttentionStatus,
  OrderDeliveryPaginatedItem,
} from "@/services/orderDeliveryService";
import {
  ATTENTION_DATE_HEADERS,
  attentionDate,
} from "@/utils/orderAttentionDate";
import { formatDate, formatTime } from "@/utils/datetime";

interface OrdenesListProps {
  orders: OrderDeliveryPaginatedItem[];
  // Pestaña activa: define qué fecha muestra la columna y con qué encabezado.
  attentionStatus: AttentionStatus;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onAttend: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function OrdenesList({
  orders,
  attentionStatus,
  loading,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
  onView,
  onEdit,
  onAttend,
  onDelete,
}: OrdenesListProps) {
  // Cuántas filas quedaron atrás en las páginas anteriores.
  const rowOffset = (currentPage - 1) * perPage;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/50 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell isHeader className="w-14 px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Nro</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">{ATTENTION_DATE_HEADERS[attentionStatus]}</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cliente</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Destino</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Proveedor</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo de Entrega</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Total</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: perPage }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-5 py-4"><div className="h-4 w-24 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="space-y-2"><div className="h-4 w-36 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /><div className="h-3 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></div></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-28 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="flex gap-2"><div className="h-5 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /></div></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 w-16 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" /></TableCell>
                  <TableCell className="px-5 py-4"><div className="ml-auto h-8 w-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-24 text-center" colSpan={8}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <BoxCubeIcon className="size-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No hay órdenes para mostrar</p>
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Modifica los filtros o registra una nueva orden de entrega.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
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
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                  <TableCell className="px-5 py-4 align-middle">
                    <span className="text-theme-sm text-gray-600 dark:text-gray-300">
                      {order.supplierName ?? "Cliente esporádico"}
                    </span>
                  </TableCell>
                  {/* "Expreso" va debajo y no al lado: al lado empujaba el ancho
                      de la columna y desalineaba las filas vecinas. */}
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
                  <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle font-bold text-gray-800 text-theme-sm tabular-nums dark:text-white/90">
                    Bs {order.totalPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onView(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                        title="Ver detalle"
                      >
                        <EyeIcon className="size-4 shrink-0" /> Ver
                      </button>
                      {!order.isAttended && (
                        <button
                          onClick={() => onAttend(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300 transition-colors"
                          title="Atender la orden y generar la guía del envío"
                        >
                          <TaskIcon className="size-4 shrink-0" /> Atender
                        </button>
                      )}
                      {/* Una orden atendida ya se convirtió en envío: el backend
                          rechaza editarla o borrarla, así que acá los botones no
                          se muestran en vez de ofrecer una acción que va a
                          rebotar. La esporádica además nunca se edita. */}
                      {!order.isAttended && (
                        <>
                          {order.orderType !== "Sporadic" && (
                            <button
                              onClick={() => onEdit(order.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="size-4 shrink-0" /> Editar
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-error-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors"
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
      <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-gray-800 bg-gray-50/30 dark:bg-transparent">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          perPageOptions={[10, 20, 50, 100]}
        />
      </div>
    </div>
  );
}
