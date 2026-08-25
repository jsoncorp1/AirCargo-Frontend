"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import {
  orderDeliveryService,
  OrderDeliveryPaginatedItem,
  OrderDeliveryListFilters,
  OrderDeliveryCounts,
  AttentionStatus,
  ATTENTION_STATUS_TABS,
  ATTENTION_STATUS_LABELS,
} from "@/services/orderDeliveryService";
import AdminOrderDeliveriesTable from "@/components/admin/AdminOrderDeliveriesTable";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import ShipmentDateRangeFilter, {
  DateRange,
  todayRange,
} from "@/components/envios/ShipmentDateRangeFilter";

const DEFAULT_PER_PAGE = 10;

export default function AdminOrdenesPage() {
  // Las tres pestañas las resuelve el backend con `attentionStatus`.
  // El listado ya viene acotado al departamento del admin.
  const [orders, setOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  // Totales reales del servidor. No se derivan de contar filas: ver `getCounts`.
  const [counts, setCounts] = useState<OrderDeliveryCounts | null>(null);

  const [statusFilter, setStatusFilter] = useState<AttentionStatus>("Unattended");
  // Por defecto se muestra el día de hoy; el usuario puede ampliarlo.
  const [dateRange, setDateRange] = useState<DateRange>(() => todayRange());
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // El rango va acá para que la lista y los contadores de las pestañas hablen
  // siempre del mismo conjunto.
  const baseFilters: OrderDeliveryListFilters = useMemo(
    () => ({
      ...(dateRange.from ? { dateFrom: dateRange.from } : {}),
      ...(dateRange.to ? { dateTo: dateRange.to } : {}),
    }),
    [dateRange.from, dateRange.to]
  );

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await orderDeliveryService.getDeliveries(page, perPage, {
        ...baseFilters,
        attentionStatus: statusFilter,
      });
      setOrders(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error fetching orders", err);
    } finally {
      setLoading(false);
    }
  }, [perPage, statusFilter, baseFilters]);

  const fetchCounts = useCallback(async () => {
    try {
      setCounts(await orderDeliveryService.getCounts(baseFilters));
    } catch (err) {
      console.error("Error fetching order counts", err);
    }
  }, [baseFilters]);

  // Tras atender una orden hay que refrescar la página y los contadores.
  const fetchOrders = useCallback(() => {
    setCurrentPage(1);
    fetchPage(1);
    fetchCounts();
  }, [fetchPage, fetchCounts]);

  useEffect(() => {
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Volver a la página 1 al cambiar el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  const paginatedOrders = orders;


  // Los contadores salen del `count` del servidor, no de contar el lote: el
  // backend recorta `perPage` y contar filas daba de menos.
  const statusTabs: TabItem[] = useMemo(
    () =>
      ATTENTION_STATUS_TABS.map((value) => ({
        value,
        label: ATTENTION_STATUS_LABELS[value],
        count:
          value === "Unattended"
            ? counts?.pending
            : value === "Attended"
            ? counts?.attended
            : counts?.total,
      })),
    [counts]
  );

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as AttentionStatus);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Órdenes de Entrega" />

      {/* La bajada sube al encabezado de la página: dentro de la tarjeta obligaba
          a repetir el título "Órdenes de Entrega" solo para poder mostrarla. */}
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Solo las órdenes cuyo departamento de origen coincide con el de tu sucursal.
        Desde aquí se atienden convirtiéndolas en envío.
      </p>

      <ComponentCard>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs items={statusTabs} value={statusFilter} onChange={handleStatusChange} />
          <ShipmentDateRangeFilter value={dateRange} onChange={handleDateRangeChange} />
        </div>
        <AdminOrderDeliveriesTable
          orders={paginatedOrders}
          attentionStatus={statusFilter}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onDataChange={fetchOrders}
        />
      </ComponentCard>
    </div>
  );
}
