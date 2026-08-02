import React from "react";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";

interface OrdenesToolbarProps {
  statusTabs: TabItem[];
  statusFilter: string;
  onStatusChange: (val: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  dateFilter: string;
  onDateChange: (val: string) => void;
  onClearFilters: () => void;
  onAddOrder: () => void;
}

export default function OrdenesToolbar({
  statusTabs,
  statusFilter,
  onStatusChange,
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateChange,
  onClearFilters,
  onAddOrder,
}: OrdenesToolbarProps) {
  return (
    <div className="flex flex-col gap-5 mb-6">
      {/* Top Row: Tabs and Primary Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs items={statusTabs} value={statusFilter} onChange={onStatusChange} />
        <Button startIcon={<PlusIcon />} onClick={onAddOrder} className="shrink-0">
          Nueva Orden de Entrega
        </Button>
      </div>

      {/* Bottom Row: Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full rounded-2xl bg-gray-50/50 p-4 border border-gray-100 dark:bg-gray-800/20 dark:border-gray-800">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="Buscar por cliente, proveedor o destino..."
            value={searchTerm}
            onChange={(e: any) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e: any) => onDateChange(e.target.value)}
          />
        </div>
        {(searchTerm || dateFilter) && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
