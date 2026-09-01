"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import {
  driverTaskService,
  DriverTask,
  DriverTaskStatus,
  DriverTaskListFilters,
  DRIVER_TASK_STATUS_LABELS,
} from "@/services/driverTaskService";
import DriverTasksTable from "@/components/conductor/DriverTasksTable";
import DriverOnlineToggle from "@/components/conductor/DriverOnlineToggle";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import ShipmentDateRangeFilter, {
  DateRange,
  todayRange,
} from "@/components/envios/ShipmentDateRangeFilter";

const DEFAULT_PER_PAGE = 10;

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

// El conductor navega SUS tareas, que ahora son de dos tipos: ir a buscar un
// paquete (recojo) y llevarlo (entrega). El backend acota `GET /driver-tasks` a
// las suyas, así que acá no hace falta mandar `driverUserId` (se ignora).
//
//   pendientes → Assigned: lo que todavía no arrancó.
//   en calle   → EnRoute: lo que ya salió a hacer.
//   historial  → todo, con filtro de estado y de fechas.
type Bandeja = "assigned" | "enroute" | "history";

export default function ConductorTareasPage() {
  const [tasks, setTasks] = useState<DriverTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const [bandeja, setBandeja] = useState<Bandeja>("assigned");
  const [statusFilter, setStatusFilter] = useState<DriverTaskStatus | "">("");
  const [dateRange, setDateRange] = useState<DateRange>(() => todayRange());

  const filters: DriverTaskListFilters = useMemo(() => {
    if (bandeja === "assigned") return { status: "Assigned" };
    if (bandeja === "enroute") return { status: "EnRoute" };
    return {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(dateRange.from ? { dateFrom: dateRange.from } : {}),
      ...(dateRange.to ? { dateTo: dateRange.to } : {}),
    };
  }, [bandeja, statusFilter, dateRange.from, dateRange.to]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driverTaskService.getTasks(currentPage, perPage, filters);
      setTasks(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error fetching driver tasks", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Volver a la página 1 al cambiar el tamaño de página o los filtros.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, filters]);

  const bandejaTabs: TabItem[] = [
    { value: "assigned", label: "Por hacer" },
    { value: "enroute", label: "En camino" },
    { value: "history", label: "Historial" },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Mis Tareas" />
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Los recojos y las entregas que tu sucursal te asignó. Marca la salida al arrancar y cierra
        la tarea con foto al llegar.
      </p>

      <div className="mb-6">
        <DriverOnlineToggle />
      </div>

      <ComponentCard>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <Tabs
            items={bandejaTabs}
            value={bandeja}
            onChange={(value) => setBandeja(value as Bandeja)}
          />
          {bandeja === "history" && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-48">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Estado
                </label>
                <select
                  className={selectClassName}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as DriverTaskStatus | "")}
                >
                  <option value="">Todos los estados</option>
                  {(
                    Object.entries(DRIVER_TASK_STATUS_LABELS) as [DriverTaskStatus, string][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <ShipmentDateRangeFilter
                className="sm:w-64"
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          )}
        </div>

        <DriverTasksTable
          tasks={tasks}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onDataChange={fetchTasks}
        />
      </ComponentCard>
    </div>
  );
}
