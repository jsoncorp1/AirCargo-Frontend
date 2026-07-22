"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { orderDeliveryService, OrderDeliveryPaginatedItem } from "@/services/orderDeliveryService";
import SupplierOrderDeliveriesTable from "@/components/proveedor/SupplierOrderDeliveriesTable";
import { useAuth } from "@/context/AuthContext";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";

const DEFAULT_PER_PAGE = 10;
// El backend no soporta filtrar por estado (pendiente/atendida) como query param;
// mientras ese filtro esté activo se trae un lote más grande y se pagina en cliente.
const STATUS_BATCH_SIZE = 200;

type StatusFilter = "" | "pending" | "attended";

export default function ProveedorOrdenesPage() {
  const { companyId } = useAuth();

  // Página real del servidor: se usa cuando el filtro de estado es "Todas".
  const [pageOrders, setPageOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageTotalCount, setPageTotalCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  // Lote grande para los tabs de estado y para filtrar Pendientes/Atendidas en cliente.
  const [allOrders, setAllOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const isFiltering = statusFilter !== "";

  const fetchPage = useCallback(async (page: number) => {
    setPageLoading(true);
    try {
      const res = await orderDeliveryService.getDeliveries(page, perPage, companyId ?? undefined);
      setPageOrders(res.data);
      setPageTotalPages(res.totalPages);
      setPageTotalCount(res.count);
    } catch (err) {
      console.error("Error fetching orders", err);
    } finally {
      setPageLoading(false);
    }
  }, [companyId, perPage]);

  const fetchBatch = useCallback(async () => {
    setBatchLoading(true);
    try {
      const res = await orderDeliveryService.getDeliveries(1, STATUS_BATCH_SIZE, companyId ?? undefined);
      setAllOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders", err);
    } finally {
      setBatchLoading(false);
    }
  }, [companyId]);

  const fetchOrders = useCallback(() => {
    fetchPage(currentPage);
    fetchBatch();
  }, [fetchPage, fetchBatch, currentPage]);

  useEffect(() => {
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  // Volver a la página 1 al cambiar el tamaño de página.
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "pending") return allOrders.filter((o) => !o.isAttended);
    if (statusFilter === "attended") return allOrders.filter((o) => o.isAttended);
    return allOrders;
  }, [allOrders, statusFilter]);

  const filteredTotalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const paginatedFiltered = filteredOrders.slice((currentPage - 1) * perPage, currentPage * perPage);

  const paginatedOrders = isFiltering ? paginatedFiltered : pageOrders;
  const totalPages = isFiltering ? filteredTotalPages : pageTotalPages;
  const loading = isFiltering ? batchLoading : pageLoading;

  const totalOrdersCount = isFiltering ? filteredOrders.length : pageTotalCount;
  const totalSales = paginatedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const attendedOrders = paginatedOrders.filter((o) => o.isAttended).length;

  const statusTabs: TabItem[] = useMemo(
    () => [
      { value: "", label: "Todas", count: allOrders.length },
      { value: "pending", label: "Pendientes", count: allOrders.filter((o) => !o.isAttended).length },
      { value: "attended", label: "Atendidas", count: allOrders.filter((o) => o.isAttended).length },
    ],
    [allOrders]
  );

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
    setCurrentPage(1);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Órdenes de Entrega" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <ComponentCard title="Mis Órdenes de Entrega">
        <div className="mb-5">
          <Tabs items={statusTabs} value={statusFilter} onChange={handleStatusChange} />
        </div>
        <SupplierOrderDeliveriesTable
          orders={paginatedOrders}
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
