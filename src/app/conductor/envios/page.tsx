"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import {
  shipmentService,
  ShipmentPaginatedItem,
  ShipmentListFilters,
  ShipmentStatus,
  SHIPMENT_STATUS_LABELS,
} from "@/services/shipmentService";
import ConductorShipmentsTable from "@/components/conductor/ConductorShipmentsTable";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import ShipmentDateRangeFilter, {
  DateRange,
  lastWeekRange,
} from "@/components/envios/ShipmentDateRangeFilter";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PER_PAGE = 10;

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

// Bandejas: el backend ya acota la lista a la sucursal del conductor; mandando
// su propio branchOfficeId se separan los envíos que recibe para entregar de
// los que salen de su sucursal.
type Bandeja = "incoming" | "outgoing" | "all";

export default function ConductorEnviosPage() {
  const { branchOfficeId, branchOfficeCode, branchOfficeCity } = useAuth();

  const [shipments, setShipments] = useState<ShipmentPaginatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShipmentsCount, setTotalShipmentsCount] = useState(0);

  // El conductor no puede listar sucursales ni proveedores (403): sus únicos
  // filtros son la bandeja (su propia sucursal como origen o destino) y el estado.
  const [bandeja, setBandeja] = useState<Bandeja>("incoming");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "">("");
  // Por defecto se muestra la última semana.
  const [dateRange, setDateRange] = useState<DateRange>(() => lastWeekRange());

  const filters: ShipmentListFilters = useMemo(() => {
    const base: ShipmentListFilters = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(dateRange.from ? { dateFrom: dateRange.from } : {}),
      ...(dateRange.to ? { dateTo: dateRange.to } : {}),
    };
    if (!branchOfficeId || bandeja === "all") return base;
    return bandeja === "incoming"
      ? { ...base, destinationBranchOfficeId: branchOfficeId }
      : { ...base, originBranchOfficeId: branchOfficeId };
  }, [bandeja, statusFilter, dateRange.from, dateRange.to, branchOfficeId]);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentService.getShipments(currentPage, perPage, filters);
      setShipments(res.data);
      setTotalPages(res.totalPages);
      setTotalShipmentsCount(res.count);
    } catch (err) {
      console.error("Error fetching shipments", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, filters]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Volver a la página 1 al cambiar el tamaño de página o los filtros.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, filters]);

  const branchLabel = [branchOfficeCode, branchOfficeCity].filter(Boolean).join(" — ");

  const bandejaTabs: TabItem[] = [
    { value: "incoming", label: "Por entregar" },
    { value: "outgoing", label: "Por despachar" },
    { value: "all", label: "Todos" },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Envíos de mi Sucursal" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {bandeja === "incoming"
                ? "Envíos por Entregar"
                : bandeja === "outgoing"
                ? "Envíos por Despachar"
                : "Total Envíos"}
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : totalShipmentsCount}
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
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Mi Sucursal
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {branchLabel || "Sin sucursal"}
            </p>
          </div>
        </div>
      </div>

      <ComponentCard
        title="Envíos"
        desc="Los envíos que recibe tu sucursal para entregar y los que salen de ella. Desde aquí registras entregas y observaciones."
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <Tabs
            items={bandejaTabs}
            value={bandeja}
            onChange={(value) => setBandeja(value as Bandeja)}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-48">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Estado
              </label>
              <select
                className={selectClassName}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | "")}
              >
                <option value="">Todos los estados</option>
                {(Object.entries(SHIPMENT_STATUS_LABELS) as [ShipmentStatus, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  )
                )}
              </select>
            </div>
            <ShipmentDateRangeFilter
              className="sm:w-64"
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>
        <ConductorShipmentsTable
          shipments={shipments}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onDataChange={fetchShipments}
        />
      </ComponentCard>
    </div>
  );
}
