import React from "react";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import SelectField from "@/components/form/Select";

interface ConductoresToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  branchFilter: string;
  onBranchChange: (val: string) => void;
  branchOptions: { value: string; label: string }[];
  onClearFilters: () => void;
  onAddConductor: () => void;
}

export default function ConductoresToolbar({
  searchTerm,
  onSearchChange,
  branchFilter,
  onBranchChange,
  branchOptions,
  onClearFilters,
  onAddConductor,
}: ConductoresToolbarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full xl:w-auto">
        <div className="min-w-[260px] flex-1">
          <Input
            placeholder="Buscar por nombre, correo o DNI..."
            value={searchTerm}
            onChange={(e: any) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <SelectField
            placeholder="Todas las sucursales"
            options={branchOptions}
            onChange={(val) => onBranchChange(val as string)}
          />
        </div>
        {(searchTerm || branchFilter) && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="flex shrink-0">
        <Button startIcon={<PlusIcon />} onClick={onAddConductor}>
          Agregar Conductor
        </Button>
      </div>
    </div>
  );
}
