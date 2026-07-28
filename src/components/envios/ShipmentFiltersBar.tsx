"use client";

import React, { useEffect, useState } from "react";
import {
  ShipmentListFilters,
  ShipmentStatus,
  SHIPMENT_STATUS_LABELS,
} from "@/services/shipmentService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { supplierService, Supplier } from "@/services/supplierService";
import ShipmentDateRangeFilter, { DateRange } from "./ShipmentDateRangeFilter";

interface ShipmentFiltersBarProps {
  value: ShipmentListFilters;
  onChange: (filters: ShipmentListFilters) => void;
  // El listado del proveedor ya viene filtrado por su empresa.
  showSupplierFilter?: boolean;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ShipmentFiltersBar({
  value,
  onChange,
  showSupplierFilter = true,
}: ShipmentFiltersBarProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [branchRes, suppRes] = await Promise.all([
          branchOfficeService.getBranchOffices(1, 100),
          showSupplierFilter ? supplierService.getSuppliers(1, 100) : Promise.resolve(null),
        ]);
        setBranchOffices(branchRes.data);
        if (suppRes) setSuppliers(suppRes.data);
      } catch (err) {
        console.error("Error fetching shipment filter options", err);
      }
    };
    fetchOptions();
  }, [showSupplierFilter]);

  const set = (patch: Partial<ShipmentListFilters>) => onChange({ ...value, ...patch });

  const hasFilters = Boolean(
    value.supplierId ||
      value.originBranchOfficeId ||
      value.destinationBranchOfficeId ||
      value.status ||
      value.dateFrom ||
      value.dateTo
  );

  const dateRange: DateRange = { from: value.dateFrom, to: value.dateTo };
  const setDateRange = (range: DateRange) =>
    set({ dateFrom: range.from, dateTo: range.to });

  const branchOptions = branchOffices.map((b) => (
    <option key={b.id} value={b.id}>{b.code} — {b.city}</option>
  ));

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
      {showSupplierFilter && (
        <div className="lg:w-56">
          <select
            className={selectClassName}
            value={value.supplierId ?? ""}
            onChange={(e) => set({ supplierId: e.target.value || undefined })}
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="lg:w-52">
        <select
          className={selectClassName}
          value={value.originBranchOfficeId ?? ""}
          onChange={(e) => set({ originBranchOfficeId: e.target.value || undefined })}
        >
          <option value="">Origen: todas</option>
          {branchOptions}
        </select>
      </div>

      <div className="lg:w-52">
        <select
          className={selectClassName}
          value={value.destinationBranchOfficeId ?? ""}
          onChange={(e) => set({ destinationBranchOfficeId: e.target.value || undefined })}
        >
          <option value="">Destino: todas</option>
          {branchOptions}
        </select>
      </div>

      <div className="lg:w-48">
        <select
          className={selectClassName}
          value={value.status ?? ""}
          onChange={(e) => set({ status: (e.target.value || undefined) as ShipmentStatus | undefined })}
        >
          <option value="">Todos los estados</option>
          {(Object.entries(SHIPMENT_STATUS_LABELS) as [ShipmentStatus, string][]).map(
            ([status, label]) => (
              <option key={status} value={status}>{label}</option>
            )
          )}
        </select>
      </div>

      <ShipmentDateRangeFilter
        className="lg:w-64"
        label=""
        value={dateRange}
        onChange={setDateRange}
      />

      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="self-start text-xs font-medium text-gray-500 underline-offset-2 hover:text-brand-600 hover:underline dark:text-gray-400 dark:hover:text-brand-400 lg:self-center"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
