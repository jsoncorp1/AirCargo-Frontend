import React, { useEffect, useState } from "react";
import {
  ShipmentListFilters,
  ShipmentStatus,
  SHIPMENT_STATUS_FILTER_OPTIONS,
} from "@/services/shipmentService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { supplierService, Supplier } from "@/services/supplierService";
import ShipmentDateRangeFilter, { DateRange } from "./ShipmentDateRangeFilter";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";

interface EnviosToolbarProps {
  filters: ShipmentListFilters;
  onFilterChange: (filters: ShipmentListFilters) => void;
  showSupplierFilter?: boolean;
  onNewShipment: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function EnviosToolbar({
  filters,
  onFilterChange,
  showSupplierFilter = true,
  onNewShipment,
}: EnviosToolbarProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);
  const [searchTermInput, setSearchTermInput] = useState(filters.searchTerm || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTermInput !== filters.searchTerm) {
        onFilterChange({ ...filters, searchTerm: searchTermInput });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTermInput, filters, onFilterChange]);

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

  const setFilter = (patch: Partial<ShipmentListFilters>) => onFilterChange({ ...filters, ...patch });

  const hasActiveFilters = Boolean(
    filters.supplierId ||
    filters.originBranchOfficeId ||
    filters.destinationBranchOfficeId ||
    filters.dateFrom ||
    filters.dateTo
  );

  const dateRange: DateRange = { from: filters.dateFrom, to: filters.dateTo };
  const setDateRange = (range: DateRange) =>
    setFilter({ dateFrom: range.from, dateTo: range.to });

  const branchOptions = branchOffices.map((b) => (
    <option key={b.id} value={b.id}>{b.code} — {b.city}</option>
  ));

  const statuses: { value: ShipmentStatus | ""; label: string }[] = [
    { value: "", label: "Todos los Envíos" },
    ...SHIPMENT_STATUS_FILTER_OPTIONS,
  ];

  return (
    <div className="mb-6 flex flex-col gap-5">
      {/* Pestañas de Estado (Tabs) */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((statusObj) => {
            const isActive = (filters.status ?? "") === statusObj.value;
            return (
              <button
                key={statusObj.value}
                onClick={() => setFilter({ status: (statusObj.value || undefined) as ShipmentStatus | undefined })}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${isActive
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.1]"
                  }`}
              >
                {statusObj.label}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 ml-4">
          <Button startIcon={<PlusIcon />} onClick={onNewShipment} className="px-6 rounded-full shadow-sm hover:shadow-md">
            Nuevo Envío
          </Button>
        </div>
      </div>

      {/* Resto de Filtros (Compactos) */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm dark:bg-white/[0.02] dark:border-gray-800">
        <div className="flex items-center gap-2 text-gray-400 pl-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-semibold uppercase tracking-wider">Filtros:</span>
        </div>

        {/* Buscador Textual */}
        <div className="relative w-full sm:w-56">
          <input
            type="text"
            placeholder="Buscar guía o cliente..."
            value={searchTermInput}
            onChange={(e) => setSearchTermInput(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pl-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 transition-all placeholder:text-gray-400"
          />
          <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {showSupplierFilter && (
          <div className="w-full sm:w-44">
            <select
              className={selectClassName}
              value={filters.supplierId ?? ""}
              onChange={(e) => setFilter({ supplierId: e.target.value || undefined })}
            >
              <option value="">Cualquier Proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="w-full sm:w-40">
          <select
            className={selectClassName}
            value={filters.originBranchOfficeId ?? ""}
            onChange={(e) => setFilter({ originBranchOfficeId: e.target.value || undefined })}
          >
            <option value="">Origen: Todos</option>
            {branchOptions}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <select
            className={selectClassName}
            value={filters.destinationBranchOfficeId ?? ""}
            onChange={(e) => setFilter({ destinationBranchOfficeId: e.target.value || undefined })}
          >
            <option value="">Destino: Todos</option>
            {branchOptions}
          </select>
        </div>

        <div className="w-full sm:w-56">
          <ShipmentDateRangeFilter
            label=""
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFilterChange({ status: filters.status })}
            className="ml-auto rounded-lg px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors dark:hover:bg-white/[0.05] dark:text-gray-400 dark:hover:text-white"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
