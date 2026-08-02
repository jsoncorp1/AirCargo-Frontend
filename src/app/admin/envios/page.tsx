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
import { orderDeliveryService } from "@/services/orderDeliveryService";
import AdminShipmentsTable from "@/components/admin/AdminShipmentsTable";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import ShipmentDateRangeFilter, {
  DateRange,
  lastWeekRange,
} from "@/components/envios/ShipmentDateRangeFilter";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PER_PAGE = 10;

// Bandejas del admin. El backend ya limita el listado a los envíos donde su
// sucursal es origen o destino; mandando el propio branchOfficeId en uno u otro
// filtro se separan las dos direcciones.
type Bandeja = "outgoing" | "incoming" | "all";

export default function AdminEnviosPage() {
  const { branchOfficeId, branchOfficeCode, branchOfficeCity } = useAuth();

  const [shipments, setShipments] = useState<ShipmentPaginatedItem[]>([]);
  const [orderTotals, setOrderTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const [totalShipmentsCount, setTotalShipmentsCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [bandeja, setBandeja] = useState<Bandeja>("outgoing");
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  // Por defecto se muestra la última semana.
  const [dateRange, setDateRange] = useState<DateRange>(() => lastWeekRange());

  const filters: ShipmentListFilters = useMemo(() => {
    const base: ShipmentListFilters = {
      ...(status ? { status } : {}),
      ...(dateRange.from ? { dateFrom: dateRange.from } : {}),
      ...(dateRange.to ? { dateTo: dateRange.to } : {}),
    };
    if (!branchOfficeId || bandeja === "all") return base;
    return bandeja === "outgoing"
      ? { ...base, originBranchOfficeId: branchOfficeId }
      : { ...base, destinationBranchOfficeId: branchOfficeId };
  }, [bandeja, status, dateRange.from, dateRange.to, branchOfficeId]);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const [res, ordersRes] = await Promise.all([
        shipmentService.getShipments(currentPage, perPage, filters),
        orderDeliveryService.getDeliveries(1, 200),
      ]);
      setShipments(res.data);
      setTotalPages(res.totalPages);
      setTotalShipmentsCount(res.count);

      const totals: Record<string, number> = {};
      ordersRes.data.forEach((o) => { totals[o.id] = o.totalPrice; });
      setOrderTotals(totals);

      const pageWeight = res.data.reduce((sum, s) => sum + s.totalWeight, 0);
      const pageRevenue = res.data.reduce((sum, s) => sum + s.shippingPrice, 0);

      setTotalWeight(pageWeight);
      setTotalRevenue(pageRevenue);
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
    { value: "outgoing", label: "Por despachar" },
    { value: "incoming", label: "Por entregar" },
    { value: "all", label: "Todos" },
  ];

  // Los envíos nacen "En tránsito" al atender la orden, así que ese es el primer
  // tab; "Pendiente" solo aparecería en "Todos". El filtro lo aplica el backend.
  const statusTabs: TabItem[] = [
    { value: "InTransit", label: SHIPMENT_STATUS_LABELS.InTransit },
    { value: "Observed", label: SHIPMENT_STATUS_LABELS.Observed },
    { value: "Delivered", label: SHIPMENT_STATUS_LABELS.Delivered },
    { value: "Rejected", label: SHIPMENT_STATUS_LABELS.Rejected },
    { value: "Returned", label: SHIPMENT_STATUS_LABELS.Returned },
    { value: "", label: "Todos" },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Envíos Logísticos" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {bandeja === "outgoing"
                ? "Envíos por Despachar"
                : bandeja === "incoming"
                ? "Envíos por Entregar"
                : "Total Envíos"}
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : totalShipmentsCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/10">
            <svg className="h-6 w-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Peso Movido (Página)
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : `${totalWeight.toFixed(2)} kg`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
            <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Costo de Envío (Página)
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : `Bs ${totalRevenue.toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>

      <ComponentCard
        title="Envíos"
        desc={
          branchLabel
            ? `Envíos de tu sucursal (${branchLabel}): los que despachas y los que recibes para entregar.`
            : "Tu usuario no tiene sucursal asignada, por lo que no puede atender envíos."
        }
      >
        <div className="mb-6 flex flex-col xl:flex-row xl:items-end gap-5 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Bandeja de Sucursal
            </p>
            <Tabs
              items={bandejaTabs}
              value={bandeja}
              onChange={(value) => setBandeja(value as Bandeja)}
            />
          </div>
          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Estado de Envío
            </p>
            <Tabs
              items={statusTabs}
              value={status}
              onChange={(value) => setStatus(value as ShipmentStatus | "")}
            />
          </div>
          <div className="xl:w-72">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Rango de Fechas
            </p>
            <ShipmentDateRangeFilter
              className="w-full"
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>
        <AdminShipmentsTable
          shipments={shipments}
          orderTotals={orderTotals}
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
