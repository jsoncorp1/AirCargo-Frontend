import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import { EyeIcon, PencilIcon, TrashBinIcon, BoxCubeIcon, TaskIcon } from "@/icons";
import { OrderDeliveryPaginatedItem } from "@/services/orderDeliveryService";

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  Prepaid: "Pagada",
  CashOnDelivery: "Por Pagar",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  Corporate: "Corporativa",
  Sporadic: "Esporádica",
};

interface OrdenesListProps {
  orders: OrderDeliveryPaginatedItem[];
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
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/50 dark:bg-white/[0.02]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Cliente / Destino</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Proveedor</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tipo de Orden</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Condiciones</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Total</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estado</TableCell>
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
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-5 py-4">
                    <p className="text-gray-800 text-theme-sm dark:text-gray-300 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("es-BO")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString("es-BO", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {order.clientFullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                  <TableCell className="px-5 py-4 font-bold text-gray-800 text-theme-sm dark:text-white/90">
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
