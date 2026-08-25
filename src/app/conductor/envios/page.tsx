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
//   asignados → "Por recoger".
//   recogidos → "Por entregar".
//   historial → todo, con filtro de estado y de fechas.
type Bandeja = "assigned" | "pickedup" | "history";

export default function ConductorEntregasPage() {
  const { branchOfficeCode, branchOfficeCity } = useAuth();

  const [assignments, setAssignments] = useState<ShipmentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [bandeja, setBandeja] = useState<Bandeja>("assigned");
  const [statusFilter, setStatusFilter] = useState<ShipmentAssignmentStatus | "">("");
  const [dateRange, setDateRange] = useState<DateRange>(() => lastWeekRange());

  const filters: AssignmentListFilters = useMemo(() => {
    if (bandeja === "assigned") return { status: "Assigned" };
    if (bandeja === "pickedup") return { status: "PickedUp" };
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
    { value: "assigned", label: "Por recoger" },
    { value: "pickedup", label: "Por entregar" },
    { value: "history", label: "Historial" },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Mis Entregas" />



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
