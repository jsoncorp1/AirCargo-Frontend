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
import { EyeIcon, BoxCubeIcon, TaskIcon } from "@/icons";
import {
  ShipmentPaginatedItem,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_BADGE,
  SHIPMENT_OBSERVATION_LABELS,
} from "@/services/shipmentService";
import ShipmentForm from "@/components/envios/ShipmentForm";
import ShipmentStatusModal from "@/components/envios/ShipmentStatusModal";
import { formatDate, formatTime } from "@/utils/datetime";

interface AdminShipmentsTableProps {
  shipments: ShipmentPaginatedItem[];
  orderTotals: Record<string, number>;
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDataChange?: () => void;
}

function SkeletonRow() {
  return (
    <TableRow>
      {[28, 24, 48, 20, 24, 24, 28, 28].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className={`h-4 w-${w} animate-pulse rounded bg-gray-100 dark:bg-gray-800`} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function AdminShipmentsTable({
  shipments,
  orderTotals,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  onDataChange,
}: AdminShipmentsTableProps) {
  const viewModal = useModal();
  const statusModal = useModal();
  const assignModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  const openView = useCallback(
    (id: string) => {
      setSelectedId(id);
      viewModal.openModal();
    },
    [viewModal]
  );

  const openStatus = useCallback(
    (id: string) => {
      setSelectedId(id);
      statusModal.openModal();
    },
    [statusModal]
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedShipmentIds(shipments.map(s => s.id));
    } else {
      setSelectedShipmentIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedShipmentIds(prev => [...prev, id]);
    } else {
      setSelectedShipmentIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setTimeout(() => {
      alert(`Se asignaron ${selectedShipmentIds.length} envíos al conductor ${selectedDriver}`);
      setSelectedShipmentIds([]);
      setSelectedDriver("");
      assignModal.closeModal();
    }, 500);
  };

  const selectedBasic = shipments.find((s) => s.id === selectedId);

  return (
    <>
      {selectedShipmentIds.length > 0 && (
        <div className="mb-4 p-3 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-800 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-sm text-brand-700 dark:text-brand-300 font-medium">
            <span className="font-bold">{selectedShipmentIds.length}</span> envíos seleccionados
          </p>
          <button 
            onClick={() => assignModal.openModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            Asignar a Conductor
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3.5 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    checked={shipments.length > 0 && selectedShipmentIds.length === shipments.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
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
                  <TableCell className="px-5 py-16 text-center" colSpan={10}>
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
                    className={`transition-colors ${selectedShipmentIds.includes(shipment.id) ? 'bg-brand-50/50 dark:bg-brand-900/20' : 'hover:bg-gray-50/70 dark:hover:bg-white/[0.02]'}`}
                  >
                    <TableCell className="px-5 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        checked={selectedShipmentIds.includes(shipment.id)}
                        onChange={(e) => handleSelectOne(shipment.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-theme-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        {formatDate(shipment.createdAt)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTime(shipment.createdAt)}
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
                          onClick={() => openStatus(shipment.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-warning-50 hover:text-warning-600 dark:hover:bg-warning-500/10 dark:hover:text-orange-400 transition-colors"
                          title="Cambiar estado / observar"
                        >
                          <TaskIcon className="size-4 shrink-0" /> Estado
                        </button>
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

      <Modal
        isOpen={statusModal.isOpen}
        onClose={statusModal.closeModal}
        className="max-w-[480px] m-4 z-50"
      >
        {statusModal.isOpen && selectedBasic && (
          <ShipmentStatusModal
            key={selectedBasic.id}
            shipmentId={selectedBasic.id}
            code={selectedBasic.code}
            currentStatus={selectedBasic.status}
            currentObservation={selectedBasic.observation}
            onClose={statusModal.closeModal}
            onSaved={() => onDataChange?.()}
          />
        )}
      </Modal>

      <Modal
        isOpen={assignModal.isOpen}
        onClose={assignModal.closeModal}
        className="max-w-[420px] m-4 z-50"
      >
        <div className="p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Asignar {selectedShipmentIds.length} envíos a Conductor
          </h4>
          <form onSubmit={handleAssignSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seleccione Conductor (Mock)</label>
              <select 
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="" disabled>Elegir conductor...</option>
                <option value="Juan Pérez">Juan Pérez - Moto 1</option>
                <option value="Carlos Gómez">Carlos Gómez - Furgoneta A</option>
                <option value="Miguel Suárez">Miguel Suárez - Moto 2</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={assignModal.closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                Asignar Envíos
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
