"use client";

import React, { useCallback, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import { EyeIcon, BoxCubeIcon, TaskIcon } from "@/icons";
import {
  DriverTask,
  driverTaskStatusLabel,
  driverTaskStatusBadge,
  driverTaskKindLabel,
  driverTaskKindBadge,
  isDriverTaskOpen,
  driverTaskActionLabel,
  DRIVER_TASK_TRANSITIONS,
  MAX_TASK_PHOTOS,
} from "@/services/driverTaskService";
import { SHIPMENT_OBSERVATION_LABELS } from "@/services/shipmentService";
import { formatBs } from "@/services/logisticsEnums";
import DriverTaskActionModal from "./DriverTaskActionModal";
import DriverTaskDetailModal from "./DriverTaskDetailModal";
import { formatDate, formatTime } from "@/utils/datetime";

interface DriverTasksTableProps {
  tasks: DriverTask[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onDataChange?: () => void;
}

/** El código de la tarea sale del envío o de la solicitud según de cuál se trate. */
const taskCode = (task: DriverTask): string =>
  (task.kind === "Pickup" ? task.pickupOrderCode : task.shipmentCode) ?? "—";

/** `09:00 – 13:00`, sin los segundos que trae el `TimeOnly` de la API. */
const windowLabel = (start?: string | null, end?: string | null): string | null => {
  if (!start || !end) return null;
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`;
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 h-4 w-32 rounded bg-gray-100 dark:bg-gray-800"></div>
      <div className="mb-3 h-6 w-48 rounded bg-gray-100 dark:bg-gray-800"></div>
      <div className="mb-4 flex gap-2">
        <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-gray-800"></div>
        <div className="h-5 w-24 rounded-full bg-gray-100 dark:bg-gray-800"></div>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="h-8 w-24 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
        <div className="h-8 w-24 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
      </div>
    </div>
  );
}

export default function DriverTasksTable({
  tasks,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  onDataChange,
}: DriverTasksTableProps) {
  const detailModal = useModal();
  const actionModal = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openDetail = useCallback(
    (id: string) => {
      setSelectedId(id);
      detailModal.openModal();
    },
    [detailModal]
  );

  const openAction = useCallback(
    (id: string) => {
      setSelectedId(id);
      actionModal.openModal();
    },
    [actionModal]
  );

  const selected = tasks.find((t) => t.id === selectedId);

  return (
    <>
      <div className="mb-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                <BoxCubeIcon className="size-7 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No tienes tareas asignadas
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => {
              const ventana =
                task.kind === "Pickup"
                  ? windowLabel(task.pickupWindowStart, task.pickupWindowEnd)
                  : null;
              // La siguiente acción define el texto del botón: "salí a buscarlo"
              // y "salí a entregarlo" no son la misma frase.
              const nextAction = DRIVER_TASK_TRANSITIONS[task.status]?.[0];

              return (
                <div
                  key={task.id}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Badge size="sm" color={driverTaskKindBadge(task.kind)}>
                          {driverTaskKindLabel(task.kind)}
                        </Badge>
                        <span className="inline-block rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {taskCode(task)}
                        </span>
                      </div>
                      <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                        {task.contactName}
                      </h3>
                    </div>
                    <Badge size="sm" color={driverTaskStatusBadge(task.status)}>
                      {driverTaskStatusLabel(task.status)}
                    </Badge>
                  </div>

                  {/* Lo que hay que cobrar en la puerta es el dato más caro de
                      olvidar, así que va arriba de todo y no como una fila más. */}
                  {task.amountToCollect > 0 && (
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 dark:border-warning-900/40 dark:bg-warning-500/10">
                      <span className="text-xs font-semibold uppercase tracking-wide text-warning-700 dark:text-warning-400">
                        Cobrar
                      </span>
                      <span className="text-lg font-bold tabular-nums text-warning-700 dark:text-warning-400">
                        {formatBs(task.amountToCollect)}
                      </span>
                    </div>
                  )}

                  <div className="mb-4 flex-1 space-y-2 text-sm">
                    {task.address && (
                      <p className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                        <svg
                          className="mt-0.5 size-4 shrink-0 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="min-w-0">
                          {task.address}
                          {task.locationUrl && (
                            <a
                              href={task.locationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 whitespace-nowrap font-medium text-brand-500 hover:underline"
                            >
                              Ver mapa
                            </a>
                          )}
                        </span>
                      </p>
                    )}

                    {/* La ventana horaria solo existe en un recojo: una entrega
                        no tiene hora comprometida con el cliente. */}
                    {ventana && (
                      <p className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Ventana:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {task.pickupDate ? `${formatDate(task.pickupDate)} ` : ""}
                          {ventana}
                        </span>
                      </p>
                    )}

                    <p className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Asignada:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {formatDate(task.assignedAt)} {formatTime(task.assignedAt)}
                      </span>
                    </p>

                    {task.startedAt && (
                      <p className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Salida:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {formatTime(task.startedAt)}
                        </span>
                      </p>
                    )}

                    {!!task.photoCount && (
                      <p className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Fotos:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {task.photoCount} de {MAX_TASK_PHOTOS}
                        </span>
                      </p>
                    )}

                    {task.observation && (
                      <div className="mt-3 rounded-lg border border-warning-100 bg-warning-50 p-2 text-xs text-warning-700 dark:border-warning-900/30 dark:bg-warning-500/10 dark:text-warning-400">
                        <span className="font-semibold">Obs:</span>{" "}
                        {SHIPMENT_OBSERVATION_LABELS[task.observation] ?? task.observation}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <button
                      onClick={() => openDetail(task.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <EyeIcon className="size-4 shrink-0" /> Detalles
                    </button>
                    {isDriverTaskOpen(task.status) && (
                      <button
                        onClick={() => openAction(task.id)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
                      >
                        <TaskIcon className="size-4 shrink-0" />
                        {nextAction ? driverTaskActionLabel(task.kind, nextAction) : "Registrar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
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
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        className="m-4 max-w-[600px] z-50"
      >
        {detailModal.isOpen && selectedId && (
          <DriverTaskDetailModal
            key={selectedId}
            taskId={selectedId}
            onClose={detailModal.closeModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={actionModal.isOpen}
        onClose={actionModal.closeModal}
        className="m-4 max-w-[520px] z-50"
      >
        {actionModal.isOpen && selected && (
          <DriverTaskActionModal
            key={selected.id}
            task={selected}
            onClose={actionModal.closeModal}
            onSaved={() => onDataChange?.()}
          />
        )}
      </Modal>
    </>
  );
}
