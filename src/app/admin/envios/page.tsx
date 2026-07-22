"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { shipmentService, ShipmentPaginatedItem } from "@/services/shipmentService";
import { orderDeliveryService } from "@/services/orderDeliveryService";
import AdminShipmentsTable from "@/components/admin/AdminShipmentsTable";

const DEFAULT_PER_PAGE = 10;

export default function AdminEnviosPage() {
  const [shipments, setShipments] = useState<ShipmentPaginatedItem[]>([]);
  const [orderTotals, setOrderTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const [totalShipmentsCount, setTotalShipmentsCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const [res, ordersRes] = await Promise.all([
        shipmentService.getShipments(currentPage, perPage),
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
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Volver a la página 1 al cambiar el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

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
              Total Envíos
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

      <ComponentCard title="Envíos">
        <AdminShipmentsTable
          shipments={shipments}
          orderTotals={orderTotals}
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
