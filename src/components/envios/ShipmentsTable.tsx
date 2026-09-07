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
import { EyeIcon, PencilIcon, TrashBinIcon, BoxCubeIcon, TaskIcon, CloseLineIcon } from "@/icons";
import {
  ShipmentPaginatedItem,
  shipmentService,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_BADGE,
  SHIPMENT_OBSERVATION_LABELS,
  canAnnulShipment,
  canEditShipment,
} from "@/services/shipmentService";
import { paymentMethodLabel } from "@/services/logisticsEnums";
import ShipmentForm from "./ShipmentForm";
import ShipmentStatusModal from "./ShipmentStatusModal";
import { formatDate, formatTime } from "@/utils/datetime";

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
  const annulModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [annulItem, setAnnulItem] = useState<ShipmentPaginatedItem | null>(null);
  const [annulReason, setAnnulReason] = useState("");
  const [isAnnulling, setIsAnnulling] = useState(false);

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

  const handleAnnulSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annulItem || !annulReason.trim()) return;

    setIsAnnulling(true);
    try {
      const res = await shipmentService.annulShipment(annulItem.id, annulReason.trim());
      showToast(
        "success",
        "Guía anulada",
        `La guía ${res.code} fue anulada correctamente.${
          res.removedFromBillingAccount
            ? " Se dio de baja la línea correspondiente de la cuenta corriente de la empresa."
            : ""
        }`
      );
      annulModal.closeModal();
      setAnnulItem(null);
      setAnnulReason("");
      onDataChange();
    } catch (err: any) {
      showToast("error", "Error al anular", err?.message || "No se pudo anular la guía.");
    } finally {
      setIsAnnulling(false);
    }
  };

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
                shipments.map((shipment) => {
                  const isAnnulled = shipment.validity === 'Annulled';

                  return (
                    <TableRow
                      key={shipment.id}
                      className={`transition-colors ${
                        isAnnulled 
                          ? 'bg-gray-50/50 opacity-75 dark:bg-gray-900/30' 
                          : 'hover:bg-gray-50/70 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <TableCell className="px-5 py-4 text-theme-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                          {formatDate(shipment.createdAt)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTime(shipment.createdAt)}
                        </p>
                      </TableCell>

                      <TableCell className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`rounded-md px-2 py-0.5 font-mono text-xs ${
                            isAnnulled 
                              ? 'line-through text-gray-400 bg-gray-100 dark:bg-gray-800' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {shipment.code}
                          </span>
                          {isAnnulled && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400 border border-error-200 dark:border-error-800">
                              ANULADA
                            </span>
                          )}
                          {isAnnulled && shipment.annulmentReason && (
                            <span className="text-[11px] text-error-600 dark:text-error-400 italic max-w-[180px] truncate" title={shipment.annulmentReason}>
                              {shipment.annulmentReason}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4">
                        <p className={`font-medium text-theme-sm ${isAnnulled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-white/90'}`}>
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
                        <Badge size="sm" color={isAnnulled ? "dark" : (SHIPMENT_STATUS_BADGE[shipment.status] ?? "light")}>
                          {isAnnulled ? "Anulada" : (SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status)}
                        </Badge>
                        {!isAnnulled && shipment.observation && (
                          <p className="mt-1 text-xs text-warning-600 dark:text-orange-400">
                            {SHIPMENT_OBSERVATION_LABELS[shipment.observation] ?? shipment.observation}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 font-medium text-gray-700 text-theme-sm dark:text-gray-300">
                        {shipment.totalWeight} kg
                      </TableCell>

                      {/* Valor de los artículos de la orden */}
                      <TableCell className="px-5 py-4 font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                        Bs {(orderTotals[shipment.orderDeliveryId] ?? 0).toFixed(2)}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-theme-sm">
                        <p className="text-gray-600 dark:text-gray-300">
                          Bs {shipment.shippingPrice.toFixed(2)}
                        </p>
                        {shipment.paymentMethod && (
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            Cobro: {paymentMethodLabel(shipment.paymentMethod)}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAnnulled ? (
                            <button
                              onClick={() => onViewShipment(shipment.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                              title="Ver detalle"
                            >
                              <EyeIcon className="size-4 shrink-0" /> Ver
                            </button>
                          ) : (
                            <>
                              {canAnnulShipment(shipment) && (
                                <button
                                  onClick={() => {
                                    setAnnulItem(shipment);
                                    setAnnulReason("");
                                    annulModal.openModal();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 hover:text-error-700 dark:hover:bg-error-500/10 dark:text-error-400 transition-colors"
                                  title="Anular guía"
                                >
                                  Anular
                                </button>
                              )}
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
                              {/* Editar y eliminar tocan el monto que ya sumó un
                                  arqueo cerrado; el backend los rechaza con
                                  `shipment.cashregister.closed`. Se ocultan en vez
                                  de dejar que revienten al apretarlos. */}
                              {canEditShipment(shipment) && (
                                <>
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
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      <Modal
        isOpen={annulModal.isOpen}
        onClose={annulModal.closeModal}
        className="max-w-[480px] m-4 z-50"
      >
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-500/10">
            <CloseLineIcon className="size-6 text-error-500" />
          </div>
          <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Anular Guía de Envío
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Esta acción quema el correlativo y la guía deja de contar para manifiestos y arqueo.
          </p>

          {annulItem && (
            <div className="mb-4 rounded-xl bg-gray-50 p-3.5 text-sm dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Guía:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-white">{annulItem.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span className="font-medium text-gray-800 dark:text-white">{annulItem.clientFullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Costo de envío:</span>
                <span className="font-semibold text-gray-800 dark:text-white">Bs {annulItem.shippingPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleAnnulSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Motivo de anulación <span className="text-error-500">*</span>
              </label>
              <textarea
                value={annulReason}
                onChange={(e) => setAnnulReason(e.target.value)}
                rows={3}
                maxLength={300}
                required
                placeholder="Ej.: Duplicado de ESP-000009 o error en datos..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-sm text-gray-800 dark:text-white focus:border-error-500 focus:outline-none focus:ring-1 focus:ring-error-500"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>Obligatorio. Máximo 300 caracteres.</span>
                <span>{annulReason.length}/300</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={annulModal.closeModal}
                disabled={isAnnulling}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isAnnulling || !annulReason.trim()}
                className="rounded-lg bg-error-600 px-4 py-2 text-sm font-semibold text-white hover:bg-error-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isAnnulling ? "Anulando..." : "Confirmar Anulación"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
