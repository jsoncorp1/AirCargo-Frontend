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
  shipmentAssignmentService,
  ShipmentAssignment,
  assignmentStatusLabel,
  assignmentStatusBadge,
  isAssignmentOpen,
  getAssignmentErrorMessage,
} from "@/services/shipmentAssignmentService";
import AssignShipmentsModal from "./AssignShipmentsModal";

const DEFAULT_PER_PAGE = 10;

// Dos caras del mismo mostrador de la sucursal DESTINO:
//   pool   → envíos que llegaron y todavía no tienen conductor.
//   ruta   → los intentos ya repartidos, para seguirlos y poder desasignar.
type Vista = "pool" | "ruta";

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

  // ─── Asignaciones en curso ────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<ShipmentAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsPerPage, setAssignmentsPerPage] = useState(DEFAULT_PER_PAGE);
  const [assignmentsTotalPages, setAssignmentsTotalPages] = useState(1);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [onlyOpen, setOnlyOpen] = useState(true);

  const fetchAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const res = await shipmentAssignmentService.getAssignments(
        assignmentsPage,
        assignmentsPerPage,
        onlyOpen ? { onlyOpen: true } : {}
      );
      setAssignments(res.data);
      setAssignmentsTotalPages(res.totalPages);
      setAssignmentsCount(res.count);
    } catch (err) {
      console.error("Error fetching assignments", err);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [assignmentsPage, assignmentsPerPage, onlyOpen]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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

  const handleCancelAssignment = (assignment: ShipmentAssignment) => {
    runCancel(async () => {
      try {
        await shipmentAssignmentService.changeStatus(assignment.id, { status: "Cancelled" });
        showToast(
          "success",
          "Asignación anulada",
          `${assignment.shipmentCode} volvió al pool de la sucursal.`
        );
        fetchAssignments();
        fetchPool();
      } catch (err: unknown) {
        showToast(
          "error",
          "Error",
          getAssignmentErrorMessage(err, "No se pudo anular la asignación.")
        );
      }
    });
  };

  const branchLabel = [branchOfficeCode, branchOfficeCity].filter(Boolean).join(" — ");

  const vistaTabs: TabItem[] = [
    { value: "pool", label: "Por asignar" },
    { value: "ruta", label: "En reparto" },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Reparto" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Esperando conductor</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {poolLoading ? "—" : poolCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {onlyOpen ? "Repartos en curso" : "Repartos en total"}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {assignmentsLoading ? "—" : assignmentsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {isSuperAdminUser ? "Alcance" : "Mi sucursal"}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {isSuperAdminUser ? "Todas las sucursales" : branchLabel || "Sin sucursal"}
          </p>
        </div>
      </div>

      <ComponentCard
        title="Reparto de última milla"
        desc="Los envíos que llegaron a la sucursal se entregan a un conductor. Si un intento falla, el envío vuelve acá para reasignarse."
      >
        <div className="mb-5">
          <Tabs items={vistaTabs} value={vista} onChange={(v) => setVista(v as Vista)} />
        </div>

        {vista === "pool" ? (
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
                        <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
                          Cargando envíos…
                        </TableCell>
                      </TableRow>
                    ) : pool.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
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
                          <TableCell className="px-5 py-3">
                            <input
                              type="checkbox"
                              checked={selected.has(shipment.id)}
                              onChange={() => toggle(shipment.id)}
                              aria-label={`Seleccionar ${shipment.code}`}
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                            />
                          </TableCell>
                          <TableCell className="px-5 py-3">
                            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {shipment.code}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {shipment.clientFullName}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {shipment.packageCount}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {shipment.totalWeight} kg
                          </TableCell>
                          <TableCell className="px-5 py-3">
                            <Badge size="sm" color={shipmentStatusBadge(shipment.status)}>
                              {shipmentStatusLabel(shipment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
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
        ) : (
          <>
            <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(e) => {
                  setOnlyOpen(e.target.checked);
                  setAssignmentsPage(1);
                }}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
              />
              Solo los repartos en curso
            </label>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    <TableRow>
                      {["Guía", "Conductor", "Estado", "Envío", "Asignado", ""].map((h, i) => (
                        <TableCell
                          key={`${h}-${i}`}
                          isHeader
                          className="px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {assignmentsLoading ? (
                      <TableRow>
                        <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
                          Cargando repartos…
                        </TableCell>
                      </TableRow>
                    ) : assignments.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-10 text-center text-sm text-gray-500">
                          No hay repartos para mostrar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map((assignment) => (
                        <TableRow
                          key={assignment.id}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/20"
                        >
                          <TableCell className="px-5 py-3">
                            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {assignment.shipmentCode}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {assignment.driverFullName}
                          </TableCell>
                          <TableCell className="px-5 py-3">
                            <Badge size="sm" color={assignmentStatusBadge(assignment.status)}>
                              {assignmentStatusLabel(assignment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-3">
                            <Badge size="sm" color={shipmentStatusBadge(assignment.shipmentStatus)}>
                              {shipmentStatusLabel(assignment.shipmentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {new Date(assignment.assignedAt).toLocaleString("es-BO")}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right">
                            {/* Solo antes del recojo: una vez que el conductor
                                salió, el cierre lo reporta él. */}
                            {assignment.status === "Assigned" && (
                              <button
                                type="button"
                                disabled={cancelling}
                                onClick={() => handleCancelAssignment(assignment)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"
                              >
                                Desasignar
                              </button>
                            )}
                            {assignment.status === "PickedUp" && (
                              <span className="text-xs text-gray-400">En la calle</span>
                            )}
                            {!isAssignmentOpen(assignment.status) && (
                              <span className="text-xs text-gray-400">Cerrado</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {assignmentsTotalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <Pagination
                  currentPage={assignmentsPage}
                  totalPages={assignmentsTotalPages}
                  onPageChange={setAssignmentsPage}
                  perPage={assignmentsPerPage}
                  onPerPageChange={setAssignmentsPerPage}
                />
              </div>
            )}
          </>
        )}
      </ComponentCard>

      <Modal isOpen={assignModal.isOpen} onClose={assignModal.closeModal} className="m-4 max-w-[560px] z-50">
        {assignModal.isOpen && selectedShipments.length > 0 && (
          <AssignShipmentsModal
            shipments={selectedShipments}
            onClose={assignModal.closeModal}
            onSaved={() => {
              setSelected(new Set());
              fetchPool();
              fetchAssignments();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
