"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import {
  shipmentService,
  ShipmentPaginatedItem,
  ShipmentStatus,
  SHIPMENT_STATUS_FILTER_OPTIONS,
} from "@/services/shipmentService";
import { orderDeliveryService } from "@/services/orderDeliveryService";
import SupplierShipmentsTable from "@/components/proveedor/SupplierShipmentsTable";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import ShipmentDateRangeFilter, {
  DateRange,
  lastWeekRange,
} from "@/components/envios/ShipmentDateRangeFilter";

const DEFAULT_PER_PAGE = 10;

// Todo el ciclo de vida, en orden: el envío nace en la sucursal origen y lo van
// moviendo el manifiesto y el reparto. El filtro lo aplica el backend.
const STATUS_TABS: TabItem[] = [
  { value: "", label: "Todos" },
  ...SHIPMENT_STATUS_FILTER_OPTIONS,
];

export default function ProveedorEnviosPage() {
  const [shipments, setShipments] = useState<ShipmentPaginatedItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShipmentsCount, setTotalShipmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [orderTotals, setOrderTotals] = useState<Record<string, number>>({});
  const [orderDates, setOrderDates] = useState<Record<string, string>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // Filtros: estado y rango de fechas de emisión de la guía. Los dos los
  // resuelve el backend. Por defecto se muestra la última semana.
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  const [dateRange, setDateRange] = useState<DateRange>(() => lastWeekRange());

  const hasFilters = Boolean(status || dateRange.from || dateRange.to);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      // El backend ya limita los listados al proveedor del usuario autenticado.
      const res = await shipmentService.getShipments(currentPage, perPage, {
        status: status || undefined,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      });
      setShipments(res.data);
      setTotalPages(res.totalPages);
      setTotalShipmentsCount(res.count);
    } catch (err) {
      console.error("Error fetching shipments", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, status, dateRange.from, dateRange.to]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderDeliveryService.getDeliveries(1, 200);
      const totals: Record<string, number> = {};
      const dates: Record<string, string> = {};
      res.data.forEach((o) => {
        totals[o.id] = o.totalPrice;
        dates[o.id] = o.createdAt;
      });
      setOrderTotals(totals);
      setOrderDates(dates);
    } catch (err) {
      console.error("Error fetching orders", err);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Volver a la página 1 al cambiar el tamaño de página o cualquier filtro.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, status, dateRange.from, dateRange.to]);

  const totalWeight = shipments.reduce((sum, s) => sum + s.totalWeight, 0);
  const totalRevenue = shipments.reduce((sum, s) => sum + s.shippingPrice, 0);

  const clearFilters = () => {
    setStatus("");
    setDateRange({});
  };

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
              {hasFilters ? "Envíos Encontrados" : "Total Envíos"}
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
        title="Mis Envíos"
        desc="Envíos generados a partir de tus órdenes de entrega. La fecha corresponde al momento en que se atendió la orden y se emitió la guía."
      >
        {/* ── Filtros: estado (tabs) y rango de fechas de emisión de guía ── */}
        <div className="mb-5 space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Estado
            </p>
            <Tabs
              items={STATUS_TABS}
              value={status}
              onChange={(value) => setStatus(value as ShipmentStatus | "")}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <ShipmentDateRangeFilter
              className="sm:w-72"
              value={dateRange}
              onChange={setDateRange}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="self-start pb-3 text-xs font-medium text-gray-500 underline-offset-2 hover:text-brand-600 hover:underline dark:text-gray-400 dark:hover:text-brand-400 sm:self-center sm:pb-2.5"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <SupplierShipmentsTable
          shipments={shipments}
          orderTotals={orderTotals}
          orderDates={orderDates}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
        />
      </ComponentCard>
    </div>
  );
}
