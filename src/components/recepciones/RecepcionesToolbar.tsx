import React from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import { PlusIcon } from "@/icons";

interface RecepcionesToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  articleFilter: string;
  onArticleChange: (val: string) => void;
  dateFilter: string;
  onDateChange: (val: string) => void;
  articlesOptions: { value: string; label: string }[];
  onClearFilters: () => void;
  onAddReceipt: () => void;
  filterResetKey: number;
}

export default function RecepcionesToolbar({
  searchTerm,
  onSearchChange,
  articleFilter,
  onArticleChange,
  dateFilter,
  onDateChange,
  articlesOptions,
  onClearFilters,
  onAddReceipt,
  filterResetKey,
}: RecepcionesToolbarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full xl:w-auto">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="Buscar por artículo o SKU..."
            value={searchTerm}
            onChange={(e: any) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <SelectField
            key={`article-${filterResetKey}`}
            placeholder="Todos los artículos"
            options={articlesOptions}
            onChange={(val) => onArticleChange(val as string)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e: any) => onDateChange(e.target.value)}
          />
        </div>
        {(searchTerm || articleFilter || dateFilter) && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="flex shrink-0">
        <Button startIcon={<PlusIcon />} onClick={onAddReceipt}>
          Nueva Recepción
        </Button>
      </div>
    </div>
  );
}
