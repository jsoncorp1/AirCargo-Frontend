"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { orderDeliveryService, OrderDeliveryPaginatedItem } from "@/services/orderDeliveryService";
import OrderDeliveriesTable from "@/components/ordenes/OrderDeliveriesTable";
import { useAuth } from "@/context/AuthContext";

export default function OrdenesPage() {
  const { companyId, role } = useAuth();
  const [orders, setOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stats
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [attendedOrders, setAttendedOrders] = useState(0);
  const isCompanyUser = role?.toLowerCase() === "usuarioempresa";
  const supplierFilter = isCompanyUser ? companyId ?? undefined : undefined;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderDeliveryService.getDeliveries(currentPage, 10, supplierFilter);
      setOrders(res.data);
      setTotalPages(res.totalPages);
      setTotalOrdersCount(res.count);

      // Compute stats for current page (or a rough estimate if no global stats endpoint exists)
      const pageTotal = res.data.reduce((sum, o) => sum + o.totalPrice, 0);
      const pageAttended = res.data.filter(o => o.isAttended).length;
      
      setTotalSales(pageTotal); // This is just for the current page, ideally backend provides global stats
      setAttendedOrders(pageAttended);
    } catch (err) {
      console.error("Error fetching orders", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, supplierFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Órdenes de Entrega" />

      {/* ─── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total orders */}
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total de Órdenes
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : totalOrdersCount}
            </p>
          </div>
        </div>

        {/* Total Sales (Page) */}
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
            <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Ventas (Página actual)
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : `Bs ${totalSales.toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* Attended */}
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-info-50 dark:bg-info-500/10">
            <svg className="h-6 w-6 text-info-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Órdenes Atendidas (Página)
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {loading ? "—" : attendedOrders}
            </p>
          </div>
        </div>
      </div>

      <ComponentCard title="Gestión de Órdenes de Entrega">
        <OrderDeliveriesTable
          orders={orders}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onDataChange={fetchOrders}
        />
      </ComponentCard>
    </div>
  );
}
