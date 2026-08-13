"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import { TrashBinIcon } from "@/icons";

import {
  OrderDeliveryPaginatedItem,
  orderDeliveryService,
} from "@/services/orderDeliveryService";
import { getApiErrorMessage, isConcurrencyConflict } from "@/services/apiErrorMessages";
import { withConcurrencyRetry } from "@/services/withConcurrencyRetry";

import OrderDeliveryForm from "./OrderDeliveryForm";
import ShipmentForm from "@/components/envios/ShipmentForm";
import OrdenesSummary from "./OrdenesSummary";
import OrdenesToolbar from "./OrdenesToolbar";
import OrdenesList from "./OrdenesList";
import { TabItem } from "@/components/ui/tabs/Tabs";

const DEFAULT_PER_PAGE = 10;
const STATUS_BATCH_SIZE = 500;

type FormMode = "create" | "edit" | "view";
type StatusFilter = "" | "pending" | "attended";

export default function OrderDeliveriesTable() {
  const { showToast } = useToast();
  const formModal = useModal();
  const attendModal = useModal();
  const deleteModal = useModal();

  // ─── Data State ──────────────────────────────────────────────────────────
  const [pageOrders, setPageOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [pageTotalPages, setPageTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);

  const [allOrders, setAllOrders] = useState<OrderDeliveryPaginatedItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(true);

  // ─── Filters & Pagination ────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ─── Fetch Logic ─────────────────────────────────────────────────────────
  const fetchPage = useCallback(async () => {
    setPageLoading(true);
    try {
      const res = await orderDeliveryService.getDeliveries(currentPage, perPage, {
        unattended: statusFilter === "pending",
      });
      setPageOrders(res.data);
      setPageTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error fetching orders", err);
    } finally {
      setPageLoading(false);
    }
  }, [currentPage, perPage, statusFilter]);

  const fetchBatch = useCallback(async () => {
    setBatchLoading(true);
    try {
      const res = await orderDeliveryService.getDeliveries(1, STATUS_BATCH_SIZE);
      setAllOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders", err);
    } finally {
      setBatchLoading(false);
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchPage();
    fetchBatch();
  }, [fetchPage, fetchBatch]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  // Volver a la página 1 al cambiar filtros o paginación
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateFilter, perPage]);

  // ─── Client-side Filtering ───────────────────────────────────────────────
  
  // Is filtering active if searching by text, date, or looking at "attended" explicitly
  const isFiltering = Boolean(searchTerm.trim()) || Boolean(dateFilter) || statusFilter === "attended" || statusFilter === "";

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allOrders.filter((o) => {
      // 1. Status Filter
      if (statusFilter === "pending" && o.isAttended) return false;
      if (statusFilter === "attended" && !o.isAttended) return false;

      // 2. Search Term Filter
      const matchesSearch =
        !term ||
        o.clientFullName.toLowerCase().includes(term) ||
        (o.supplierName && o.supplierName.toLowerCase().includes(term)) ||
        o.destinationDepartment.toLowerCase().includes(term);

      // 3. Date Filter
      let matchesDate = true;
      if (dateFilter) {
        const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
        matchesDate = orderDate === dateFilter;
      }

      return matchesSearch && matchesDate;
    });
  }, [allOrders, statusFilter, searchTerm, dateFilter]);

  const filteredTotalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const paginatedFiltered = filteredOrders.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Si no hay búsqueda de texto ni fecha, y estamos en "pending", usamos pageOrders (server paginated).
  // Sino, usamos filteredOrders (client paginated).
  const isServerPaging = statusFilter === "pending" && !searchTerm && !dateFilter;
  const paginated = isServerPaging ? pageOrders : paginatedFiltered;
  const totalPages = isServerPaging ? pageTotalPages : filteredTotalPages;
  const loading = isServerPaging ? pageLoading : batchLoading;

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setCurrentPage(1);
  };

  // ─── Summary Computations ───────────────────────────────────────────────
  
  const ordenesPendientes = allOrders.filter(o => !o.isAttended).length;
  const ordenesAtendidas = allOrders.filter(o => o.isAttended).length;
  const volumenTotal = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const statusTabs: TabItem[] = useMemo(
    () => [
      { value: "pending", label: "Por atender", count: ordenesPendientes },
      { value: "attended", label: "Atendidas", count: ordenesAtendidas },
      { value: "", label: "Todas", count: allOrders.length },
    ],
    [ordenesPendientes, ordenesAtendidas, allOrders.length]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────

  const openCreate = useCallback(() => { setSelectedId(null); setFormMode("create"); formModal.openModal(); }, [formModal]);
  const openView = useCallback((id: string) => { setSelectedId(id); setFormMode("view"); formModal.openModal(); }, [formModal]);
  const openEdit = useCallback((id: string) => { setSelectedId(id); setFormMode("edit"); formModal.openModal(); }, [formModal]);
  const openAttend = useCallback((id: string) => { setSelectedId(id); attendModal.openModal(); }, [attendModal]);
  const askDelete = useCallback((id: string) => { setSelectedId(id); deleteModal.openModal(); }, [deleteModal]);

  const { pending: deleting, run: runDelete } = useSubmitLock();

  const handleDelete = () =>
    runDelete(async () => {
      if (!selectedId) return;
      try {
        // Eliminar devuelve el stock al artículo: mismo token de concurrencia,
        // mismo 409 sin cambios guardados. Reintentar no borra dos veces.
        await withConcurrencyRetry(() => orderDeliveryService.deleteDelivery(selectedId));
        showToast("success", "Orden eliminada", "El registro ha sido eliminado exitosamente.");
        deleteModal.closeModal();
        fetchAll();
      } catch (error: unknown) {
        showToast(
          "error",
          isConcurrencyConflict(error) ? "Conflicto de concurrencia" : "Error al eliminar",
          getApiErrorMessage(error, "No se pudo eliminar la orden.")
        );
        if (isConcurrencyConflict(error)) fetchAll();
      }
    });

  const selectedOrderBasic = allOrders.find(o => o.id === selectedId);

  return (
    <div className="space-y-6">
      <OrdenesSummary
        ordenesPendientes={ordenesPendientes}
        ordenesAtendidas={ordenesAtendidas}
        volumenTotal={volumenTotal}
        loading={batchLoading}
      />

      <OrdenesToolbar
        statusTabs={statusTabs}
        statusFilter={statusFilter}
        onStatusChange={(val) => setStatusFilter(val as StatusFilter)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        onClearFilters={clearFilters}
        onAddOrder={openCreate}
      />

      <OrdenesList
        orders={paginated}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setPerPage}
        onView={openView}
        onEdit={openEdit}
        onAttend={openAttend}
        onDelete={askDelete}
      />

      {/* Form Modal */}
      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="max-w-[700px] m-4 z-50">
        {formModal.isOpen && (
          <OrderDeliveryForm
            key={selectedId ?? "new"}
            mode={formMode}
            orderId={selectedId}
            onClose={formModal.closeModal}
            onSaved={fetchAll}
          />
        )}
      </Modal>

      {/* Atender: crea el envío de la orden */}
      <Modal isOpen={attendModal.isOpen} onClose={attendModal.closeModal} className="max-w-[700px] m-4 z-50">
        {attendModal.isOpen && selectedId && (
          <ShipmentForm
            key={`attend-${selectedId}`}
            mode="create"
            presetOrderDeliveryId={selectedId}
            onClose={attendModal.closeModal}
            onSaved={fetchAll}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="max-w-[420px] m-4 z-50">
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 dark:bg-error-500/10">
            <TrashBinIcon className="size-6 text-error-500" />
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Eliminar Orden de Entrega
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            ¿Estás segura de eliminar esta orden?
          </p>
          {selectedOrderBasic && (
            <div className="mb-5 mt-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
              <p className="font-medium text-gray-800 dark:text-white/90">Cliente: {selectedOrderBasic.clientFullName}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Destino: {selectedOrderBasic.destinationDepartment}</p>
            </div>
          )}
          <p className="mb-6 text-xs text-error-500">Esta acción no se puede deshacer y puede afectar los envíos asociados.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={deleteModal.closeModal} disabled={deleting}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-error-500 hover:bg-error-600 text-white border-transparent">
              {deleting ? "Eliminando…" : "Sí, eliminar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
