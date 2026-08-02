"use client";

import React, { useState, useCallback } from "react";
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

interface ConductorShipmentsTableProps {
  shipments: ShipmentPaginatedItem[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDataChange?: () => void;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-pulse">
      <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded mb-3"></div>
      <div className="h-6 w-48 bg-gray-100 dark:bg-gray-800 rounded mb-3"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
        <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-end gap-2">
        <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
        <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function ConductorShipmentsTable({
  shipments,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  onDataChange,
}: ConductorShipmentsTableProps) {
  const viewModal = useModal();
  const statusModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selectedBasic = shipments.find((s) => s.id === selectedId);

  return (
    <>
      <div className="mb-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : shipments.length === 0 ? (
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                <BoxCubeIcon className="size-7 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No hay envíos en tu ruta
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shipments.map((shipment) => (
              <div 
                key={shipment.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono text-xs px-2 py-1 rounded-md mb-2">
                      {shipment.code}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {shipment.clientFullName}
                    </h3>
                  </div>
                  <Badge size="sm" color={SHIPMENT_STATUS_BADGE[shipment.status] ?? "light"}>
                    {SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4 flex-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Ruta:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {shipment.originBranchOfficeCode ?? "—"} &rarr; {shipment.destinationBranchOfficeCode ?? "—"}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Peso:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{shipment.totalWeight} kg</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {new Date(shipment.createdAt).toLocaleDateString("es-BO")} {new Date(shipment.createdAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </p>
                  
                  {shipment.observation && (
                    <div className="mt-3 p-2 bg-warning-50 dark:bg-warning-500/10 rounded-lg text-xs text-warning-700 dark:text-warning-400 border border-warning-100 dark:border-warning-900/30">
                      <span className="font-semibold">Obs:</span> {SHIPMENT_OBSERVATION_LABELS[shipment.observation] ?? shipment.observation}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex gap-2">
                  <button
                    onClick={() => openView(shipment.id)}
                    className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <EyeIcon className="size-4 shrink-0" /> Detalles
                  </button>
                  {shipment.status !== "Delivered" && (
                    <button
                      onClick={() => openStatus(shipment.id)}
                      className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
                    >
                      <TaskIcon className="size-4 shrink-0" /> Gestionar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            perPage={perPage}
            onPerPageChange={onPerPageChange}
          />
        </div>
      )}

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
    </>
  );
}
