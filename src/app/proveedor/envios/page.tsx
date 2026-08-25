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
  todayRange,
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
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // Filtros: estado y rango de fechas de emisión de la guía. Los dos los
  // resuelve el backend. Por defecto se muestra el día de hoy.
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  const [dateRange, setDateRange] = useState<DateRange>(() => todayRange());

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
    } catch (err) {
      console.error("Error fetching shipments", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, status, dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Volver a la página 1 al cambiar el tamaño de página o cualquier filtro.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, status, dateRange.from, dateRange.to]);

  const clearFilters = () => {
    setStatus("");
    setDateRange({});
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Envíos Logísticos" />

      {/* La bajada sube al encabezado de la página: dentro de la tarjeta obligaba
          a repetir el título solo para poder mostrarla. */}
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Envíos generados a partir de tus órdenes de entrega. La fecha corresponde al momento en
        que se atendió la orden y se emitió la guía.
      </p>

      <ComponentCard>
        {/* ── Filtros: estado (tabs) y rango de fechas de emisión de guía ── */}
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Tabs
            items={STATUS_TABS}
            value={status}
            onChange={(value) => setStatus(value as ShipmentStatus | "")}
          />

          <div className="flex items-center gap-3">
            <ShipmentDateRangeFilter value={dateRange} onChange={setDateRange} />
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 text-xs font-medium text-gray-500 underline-offset-2 hover:text-brand-600 hover:underline dark:text-gray-400 dark:hover:text-brand-400"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <SupplierShipmentsTable
          shipments={shipments}
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
