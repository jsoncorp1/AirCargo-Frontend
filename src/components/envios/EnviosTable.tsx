"use client";

import React, { useEffect, useState, useCallback } from "react";
import { shipmentService, ShipmentPaginatedItem, ShipmentListFilters } from "@/services/shipmentService";
import { orderDeliveryService } from "@/services/orderDeliveryService";
import ShipmentsTable from "./ShipmentsTable";
import EnviosToolbar from "./EnviosToolbar";
import EnviosSummary from "./EnviosSummary";
import { lastWeekRange } from "./ShipmentDateRangeFilter";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import ShipmentForm from "./ShipmentForm";
import ShipmentStatusModal from "./ShipmentStatusModal";

const DEFAULT_PER_PAGE = 10;
type FormMode = "create" | "edit" | "view";

export default function EnviosTable() {
  const [shipments, setShipments] = useState<ShipmentPaginatedItem[]>([]);
  const [orderTotals, setOrderTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  // Stats
  const [totalShipmentsCount, setTotalShipmentsCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Filters
  const [filters, setFilters] = useState<ShipmentListFilters>({});

  // Modals state
  const formModal = useModal();
  const statusModal = useModal();
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

      // Compute stats for current page
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, filters]);

  // Handlers for Table actions
  const handleNewShipment = useCallback(() => {
    setSelectedId(null);
    setFormMode("create");
    formModal.openModal();
  }, [formModal]);

  const handleEditShipment = useCallback((id: string) => {
    setSelectedId(id);
    setFormMode("edit");
    formModal.openModal();
  }, [formModal]);

  const handleViewShipment = useCallback((id: string) => {
    setSelectedId(id);
    setFormMode("view");
    formModal.openModal();
  }, [formModal]);

  const handleStatusShipment = useCallback((id: string) => {
    setSelectedId(id);
    statusModal.openModal();
  }, [statusModal]);

  const selectedBasic = shipments.find(s => s.id === selectedId);

  // Filtro local ya que el backend no lo soporta de forma nativa sin recompilar
  const filteredShipments = shipments.filter((s) => {
    if (!filters.searchTerm) return true;
    const term = filters.searchTerm.toLowerCase();
    return (
      s.code.toLowerCase().includes(term) ||
      (s.clientFullName && s.clientFullName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <EnviosSummary
        totalShipmentsCount={totalShipmentsCount}
        totalWeight={totalWeight}
        totalRevenue={totalRevenue}
        loading={loading}
      />

      <EnviosToolbar
        filters={filters}
        onFilterChange={setFilters}
        onNewShipment={handleNewShipment}
      />

      <ShipmentsTable
        shipments={filteredShipments}
        orderTotals={orderTotals}
        loading={loading}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onDataChange={fetchShipments}
        onNewShipment={handleNewShipment}
        onEditShipment={handleEditShipment}
        onViewShipment={handleViewShipment}
        onStatusShipment={handleStatusShipment}
      />

      {/* Form Modal */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.closeModal}
        className="max-w-[700px] m-4 z-50"
      >
        {formModal.isOpen && (
          <ShipmentForm
            key={selectedId ?? "new"}
            mode={formMode}
            shipmentId={selectedId}
            onClose={formModal.closeModal}
            onSaved={fetchShipments}
          />
        )}
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={statusModal.closeModal}
        className="max-w-[480px] m-4 z-50"
      >
        {statusModal.isOpen && selectedBasic && (
          <ShipmentStatusModal
            key={selectedBasic.id}
            shipmentId={selectedBasic.id}
            code={selectedBasic.code}
            currentStatus={selectedBasic.status}
            currentObservation={selectedBasic.observation}
            onClose={statusModal.closeModal}
            onSaved={fetchShipments}
          />
        )}
      </Modal>
    </div>
  );
}
