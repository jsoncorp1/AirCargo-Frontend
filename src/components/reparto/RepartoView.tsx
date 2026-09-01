"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useAuth } from "@/context/AuthContext";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import {
  shipmentService,
  ShipmentPaginatedItem,
  ShipmentStatus,
  shipmentStatusLabel,
  shipmentStatusBadge,
  SHIPMENT_OBSERVATION_LABELS,
} from "@/services/shipmentService";
import {
  driverTaskService,
  DriverTask,
  driverTaskStatusLabel,
  driverTaskStatusBadge,
  driverTaskKindLabel,
  driverTaskKindBadge,
  isDriverTaskOpen,
  getDriverTaskErrorMessage,
} from "@/services/driverTaskService";
import AssignShipmentsModal from "./AssignShipmentsModal";
import ShipmentHandoverModal from "@/components/envios/ShipmentHandoverModal";
import { formatDateTime } from "@/utils/datetime";

const DEFAULT_PER_PAGE = 10;

// Tres caras del mismo mostrador de la sucursal DESTINO:
//   pool   → envíos a domicilio que llegaron y todavía no tienen conductor.
//   ruta   → las tareas ya repartidas, para seguirlas y poder desasignar.
//   retiro → los que terminan en sucursal y esperan que el cliente los busque.
type Vista = "pool" | "ruta" | "retiro";

// Un envío es asignable si está en `AtDestinationBranch` (primer intento) o en
// `Observed` (reintento tras una entrega fallida).
const POOL_TABS: TabItem[] = [
  { value: "AtDestinationBranch", label: "Listos para repartir" },
  { value: "Observed", label: "Reintentos" },
];

export default function RepartoView() {
  const { showToast } = useToast();
  const { branchOfficeId, branchOfficeCode, branchOfficeCity, isSuperAdminUser } = useAuth();
  const assignModal = useModal();
  const handoverModal = useModal();
  const { pending: cancelling, run: runCancel } = useSubmitLock();

  const [vista, setVista] = useState<Vista>("pool");

  // ─── Pool de envíos por asignar ───────────────────────────────────────────
  const [poolStatus, setPoolStatus] = useState<ShipmentStatus>("AtDestinationBranch");
  const [pool, setPool] = useState<ShipmentPaginatedItem[]>([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolPage, setPoolPage] = useState(1);
  const [poolPerPage, setPoolPerPage] = useState(DEFAULT_PER_PAGE);
  const [poolTotalPages, setPoolTotalPages] = useState(1);
  const [poolCount, setPoolCount] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchPool = useCallback(async () => {
    setPoolLoading(true);
    try {
      const res = await shipmentService.getShipments(poolPage, poolPerPage, {
        status: poolStatus,
        // El admin ya está acotado server-side, pero mandarlo evita que el
        // superadmin vea el pool de todas las sucursales mezclado.
        ...(branchOfficeId ? { destinationBranchOfficeId: branchOfficeId } : {}),
      });
      setPool(res.data);
      setPoolTotalPages(res.totalPages);
      setPoolCount(res.count);
    } catch (err) {
      console.error("Error fetching assignable shipments", err);
    } finally {
      setPoolLoading(false);
    }
  }, [poolPage, poolPerPage, poolStatus, branchOfficeId]);

  // ─── Tareas en curso ──────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<DriverTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(DEFAULT_PER_PAGE);
  const [tasksTotalPages, setTasksTotalPages] = useState(1);
  const [tasksCount, setTasksCount] = useState(0);
  const [onlyOpen, setOnlyOpen] = useState(true);

  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await driverTaskService.getTasks(
        tasksPage,
        tasksPerPage,
        onlyOpen ? { onlyOpen: true } : {}
      );
      setTasks(res.data);
      setTasksTotalPages(res.totalPages);
      setTasksCount(res.count);
    } catch (err) {
      console.error("Error fetching driver tasks", err);
    } finally {
      setTasksLoading(false);
    }
  }, [tasksPage, tasksPerPage, onlyOpen]);

  // ─── Cola de retiro en mostrador ──────────────────────────────────────────
  const [pickups, setPickups] = useState<ShipmentPaginatedItem[]>([]);
  const [pickupsLoading, setPickupsLoading] = useState(true);
  const [pickupsPage, setPickupsPage] = useState(1);
  const [pickupsPerPage, setPickupsPerPage] = useState(DEFAULT_PER_PAGE);
  const [pickupsTotalPages, setPickupsTotalPages] = useState(1);
  const [pickupsCount, setPickupsCount] = useState(0);
  const [handoverTarget, setHandoverTarget] = useState<ShipmentPaginatedItem | null>(null);

  const fetchPickups = useCallback(async () => {
    setPickupsLoading(true);
    try {
      const res = await shipmentService.getShipments(pickupsPage, pickupsPerPage, {
        status: "AwaitingCustomerPickup",
        ...(branchOfficeId ? { destinationBranchOfficeId: branchOfficeId } : {}),
      });
      setPickups(res.data);
      setPickupsTotalPages(res.totalPages);
      setPickupsCount(res.count);
    } catch (err) {
      console.error("Error fetching shipments awaiting pickup", err);
    } finally {
      setPickupsLoading(false);
    }
  }, [pickupsPage, pickupsPerPage, branchOfficeId]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  // Cambiar de bandeja o de página invalida la selección: los ids marcados ya no
  // están en pantalla y asignarlos a ciegas sería una sorpresa.
  useEffect(() => {
    setSelected(new Set());
  }, [poolStatus, poolPage, poolPerPage]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = pool.length > 0 && selected.size === pool.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pool.map((s) => s.id)));

  const selectedShipments = useMemo(
    () => pool.filter((s) => selected.has(s.id)),
    [pool, selected]
  );

  const handleCancelTask = (task: DriverTask) => {
    runCancel(async () => {
      try {
        await driverTaskService.changeStatus(task.id, { status: "Cancelled" });
        showToast(
          "success",
          "Tarea anulada",
          task.kind === "Pickup"
            ? `${task.pickupOrderCode ?? "La solicitud"} volvió a quedar confirmada.`
            : `${task.shipmentCode ?? "El envío"} volvió al pool de la sucursal.`
        );
        fetchTasks();
        fetchPool();
      } catch (err: unknown) {
        showToast("error", "Error", getDriverTaskErrorMessage(err, "No se pudo anular la tarea."));
      }
    });
  };

  const openHandover = (shipment: ShipmentPaginatedItem) => {
    setHandoverTarget(shipment);
    handoverModal.openModal();
  };

  const branchLabel = [branchOfficeCode, branchOfficeCity].filter(Boolean).join(" — ");

  const vistaTabs: TabItem[] = [
    { value: "pool", label: "Por asignar", count: poolLoading ? undefined : poolCount },
    { value: "ruta", label: "En calle", count: tasksLoading ? undefined : tasksCount },
    {
      value: "retiro",
      label: "Esperando retiro",
      count: pickupsLoading ? undefined : pickupsCount,
    },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Reparto" />
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Los envíos a domicilio se le entregan a un conductor; si un intento falla, el envío vuelve
        acá para reasignarse. Los que terminan en sucursal no se asignan: esperan que el cliente
        los venga a buscar.
      </p>

      <ComponentCard>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs items={vistaTabs} value={vista} onChange={(v) => setVista(v as Vista)} />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {isSuperAdminUser ? "Todas las sucursales" : branchLabel || "Sin sucursal"}
          </p>
        </div>

        {vista === "pool" && (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                items={POOL_TABS}
                value={poolStatus}
                onChange={(v) => setPoolStatus(v as ShipmentStatus)}
              />
              <Button
                size="sm"
                disabled={selected.size === 0}
                onClick={assignModal.openModal}
                className="shrink-0"
              >
                Asignar {selected.size > 0 ? `(${selected.size})` : ""}
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Seleccionar todos"
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                        />
                      </TableCell>
                      {["Guía", "Cliente", "Bultos", "Peso", "Estado", "Observación"].map((h) => (
                        <TableCell
                          key={h}
                          isHeader
                          className="px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {poolLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                          Cargando envíos…
                        </TableCell>
                      </TableRow>
                    ) : pool.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                          {poolStatus === "Observed"
                            ? "No hay envíos esperando un segundo intento."
                            : "No hay envíos esperando conductor."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pool.map((shipment) => (
                        <TableRow
                          key={shipment.id}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/20"
                        >
                          <TableCell className="px-5 py-3 align-middle">
                            <input
                              type="checkbox"
                              checked={selected.has(shipment.id)}
                              onChange={() => toggle(shipment.id)}
                              aria-label={`Seleccionar ${shipment.code}`}
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3 align-middle">
                            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {shipment.code}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle text-sm font-medium text-gray-800 dark:text-gray-200">
                            {shipment.clientFullName}
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle text-sm text-gray-600 dark:text-gray-300">
                            {shipment.packageCount}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3 align-middle text-sm tabular-nums text-gray-600 dark:text-gray-300">
                            {shipment.totalWeight} kg
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle">
                            <Badge size="sm" color={shipmentStatusBadge(shipment.status)}>
                              {shipmentStatusLabel(shipment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle text-sm text-gray-600 dark:text-gray-300">
                            {shipment.observation
                              ? SHIPMENT_OBSERVATION_LABELS[shipment.observation] ??
                                shipment.observation
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {poolTotalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <Pagination
                  currentPage={poolPage}
                  totalPages={poolTotalPages}
                  onPageChange={setPoolPage}
                  perPage={poolPerPage}
                  onPerPageChange={setPoolPerPage}
                />
              </div>
            )}
          </>
        )}

        {vista === "ruta" && (
          <>
            <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(e) => {
                  setOnlyOpen(e.target.checked);
                  setTasksPage(1);
                }}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
              />
              Solo las tareas en curso
            </label>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    <TableRow>
                      {["Tipo", "Referencia", "Conductor", "Estado", "Destino", "Asignada", ""].map(
                        (h, i) => (
                          <TableCell
                            key={`${h}-${i}`}
                            isHeader
                            className="px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                          >
                            {h}
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {tasksLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                          Cargando tareas…
                        </TableCell>
                      </TableRow>
                    ) : tasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                          No hay tareas para mostrar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tasks.map((task) => (
                        <TableRow
                          key={task.id}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/20"
                        >
                          <TableCell className="px-5 py-3 align-middle">
                            <Badge size="sm" color={driverTaskKindBadge(task.kind)}>
                              {driverTaskKindLabel(task.kind)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3 align-middle">
                            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {(task.kind === "Pickup" ? task.pickupOrderCode : task.shipmentCode) ??
                                "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle text-sm font-medium text-gray-800 dark:text-gray-200">
                            {task.driverFullName}
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle">
                            <Badge size="sm" color={driverTaskStatusBadge(task.status)}>
                              {driverTaskStatusLabel(task.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle text-sm text-gray-600 dark:text-gray-300">
                            {task.contactName}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3 align-middle text-sm text-gray-600 dark:text-gray-300">
                            {formatDateTime(task.assignedAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3 text-right align-middle">
                            {/* Solo antes de que salga: una vez en la calle, el
                                cierre lo reporta el conductor. */}
                            {task.status === "Assigned" && (
                              <button
                                type="button"
                                disabled={cancelling}
                                onClick={() => handleCancelTask(task)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"
                              >
                                Desasignar
                              </button>
                            )}
                            {task.status === "EnRoute" && (
                              <span className="text-xs text-gray-400">En la calle</span>
                            )}
                            {!isDriverTaskOpen(task.status) && (
                              <span className="text-xs text-gray-400">Cerrada</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {tasksTotalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <Pagination
                  currentPage={tasksPage}
                  totalPages={tasksTotalPages}
                  onPageChange={setTasksPage}
                  perPage={tasksPerPage}
                  onPerPageChange={setTasksPerPage}
                />
              </div>
            )}
          </>
        )}

        {vista === "retiro" && (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Estos envíos terminan en mostrador: no se le asignan a ningún conductor. Al
              entregarlos hay que registrar quién los retiró.
            </p>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    <TableRow>
                      {["Guía", "Cliente", "Bultos", "Peso", "Importe", ""].map((h, i) => (
                        <TableCell
                          key={`${h}-${i}`}
                          isHeader
                          className={`px-5 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 ${
                            h === "Importe" ? "text-right" : "text-start"
                          }`}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pickupsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                          Cargando envíos…
                        </TableCell>
                      </TableRow>
                    ) : pickups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                          No hay envíos esperando que los retiren.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pickups.map((shipment) => (
                        <TableRow
                          key={shipment.id}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/20"
                        >
                          <TableCell className="whitespace-nowrap px-5 py-3 align-middle">
                            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {shipment.code}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle text-sm font-medium text-gray-800 dark:text-gray-200">
                            {shipment.clientFullName}
                          </TableCell>
                          <TableCell className="px-5 py-3 align-middle text-sm text-gray-600 dark:text-gray-300">
                            {shipment.packageCount}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3 align-middle text-sm tabular-nums text-gray-600 dark:text-gray-300">
                            {shipment.totalWeight} kg
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3 text-right align-middle text-sm tabular-nums text-gray-600 dark:text-gray-300">
                            Bs {shipment.shippingPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3 text-right align-middle">
                            <button
                              type="button"
                              onClick={() => openHandover(shipment)}
                              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                            >
                              Registrar retiro
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {pickupsTotalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <Pagination
                  currentPage={pickupsPage}
                  totalPages={pickupsTotalPages}
                  onPageChange={setPickupsPage}
                  perPage={pickupsPerPage}
                  onPerPageChange={setPickupsPerPage}
                />
              </div>
            )}
          </>
        )}
      </ComponentCard>

      <Modal
        isOpen={assignModal.isOpen}
        onClose={assignModal.closeModal}
        className="m-4 max-w-[560px] z-50"
      >
        {assignModal.isOpen && selectedShipments.length > 0 && (
          <AssignShipmentsModal
            shipments={selectedShipments}
            onClose={assignModal.closeModal}
            onSaved={() => {
              setSelected(new Set());
              fetchPool();
              fetchTasks();
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={handoverModal.isOpen}
        onClose={handoverModal.closeModal}
        className="m-4 max-w-[480px] z-50"
      >
        {handoverModal.isOpen && handoverTarget && (
          <ShipmentHandoverModal
            key={handoverTarget.id}
            shipmentId={handoverTarget.id}
            shipmentCode={handoverTarget.code}
            clientFullName={handoverTarget.clientFullName}
            onClose={handoverModal.closeModal}
            onSaved={fetchPickups}
          />
        )}
      </Modal>
    </div>
  );
}
