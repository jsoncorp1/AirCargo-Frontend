"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import {
  shipmentAssignmentService,
  ShipmentAssignment,
  ShipmentAssignmentStatus,
  AssignmentListFilters,
  ASSIGNMENT_STATUS_LABELS,
} from "@/services/shipmentAssignmentService";
import ConductorAssignmentsTable from "@/components/conductor/ConductorAssignmentsTable";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import ShipmentDateRangeFilter, {
  DateRange,
  lastWeekRange,
} from "@/components/envios/ShipmentDateRangeFilter";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PER_PAGE = 10;

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

// El conductor ya no navega envíos: navega SUS intentos de reparto. El backend
// acota `GET /shipment-assignments` a los suyos, así que acá no hace falta
// mandar `driverUserId` (de hecho se ignora).
//
//   pendientes → onlyOpen=true: Assigned + PickedUp, "lo que me queda hoy".
//   historial  → todo, con filtro de estado y de fechas.
type Bandeja = "open" | "history";

export default function ConductorEntregasPage() {
  const { branchOfficeCode, branchOfficeCity } = useAuth();

  const [assignments, setAssignments] = useState<ShipmentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [bandeja, setBandeja] = useState<Bandeja>("open");
  const [statusFilter, setStatusFilter] = useState<ShipmentAssignmentStatus | "">("");
  const [dateRange, setDateRange] = useState<DateRange>(() => lastWeekRange());

  const filters: AssignmentListFilters = useMemo(() => {
    // En "pendientes" no tiene sentido filtrar por fecha ni por estado: son las
    // entregas vivas, y son pocas.
    if (bandeja === "open") return { onlyOpen: true };
    return {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(dateRange.from ? { dateFrom: dateRange.from } : {}),
      ...(dateRange.to ? { dateTo: dateRange.to } : {}),
    };
  }, [bandeja, statusFilter, dateRange.from, dateRange.to]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentAssignmentService.getAssignments(currentPage, perPage, filters);
      setAssignments(res.data);
      setTotalPages(res.totalPages);
      setTotalCount(res.count);
    } catch (err) {
      console.error("Error fetching assignments", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, filters]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Volver a la página 1 al cambiar el tamaño de página o los filtros.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, filters]);

  const branchLabel = [branchOfficeCode, branchOfficeCity].filter(Boolean).join(" — ");

  const bandejaTabs: TabItem[] = [
    { value: "open", label: "Por repartir" },
    { value: "history", label: "Historial" },
  ];

  const pendingPickup = assignments.filter((a) => a.status === "Assigned").length;

  return (
    <div>
      <PageBreadcrumb pageTitle="Mis Entregas" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {bandeja === "open" ? "Entregas Pendientes" : "Entregas en el Período"}
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : totalCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/10">
            <svg className="h-6 w-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Por Recoger en Sucursal
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : pendingPickup}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
            <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mi Sucursal</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {branchLabel || "Sin sucursal"}
            </p>
          </div>
        </div>
      </div>

      <ComponentCard
        title="Entregas"
        desc="Los envíos que tu sucursal te asignó. Marca el recojo al salir y registra la entrega con foto al llegar."
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <Tabs items={bandejaTabs} value={bandeja} onChange={(value) => setBandeja(value as Bandeja)} />
          {bandeja === "history" && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-48">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Estado
                </label>
                <select
                  className={selectClassName}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ShipmentAssignmentStatus | "")}
                >
                  <option value="">Todos los estados</option>
                  {(
                    Object.entries(ASSIGNMENT_STATUS_LABELS) as [ShipmentAssignmentStatus, string][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <ShipmentDateRangeFilter className="sm:w-64" value={dateRange} onChange={setDateRange} />
            </div>
          )}
        </div>
        <ConductorAssignmentsTable
          assignments={assignments}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onDataChange={fetchAssignments}
        />
      </ComponentCard>
    </div>
  );
}
