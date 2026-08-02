import React from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import { PlusIcon } from "@/icons";
import { BolivianDepartment, BOLIVIAN_DEPARTMENT_LABELS } from "@/services/supplierService";

const DEPARTMENT_OPTIONS = (Object.keys(BOLIVIAN_DEPARTMENT_LABELS) as BolivianDepartment[]).map(
  (value) => ({ value, label: BOLIVIAN_DEPARTMENT_LABELS[value] })
);

interface ProveedoresToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  departmentFilter: "" | BolivianDepartment;
  onDepartmentChange: (val: "" | BolivianDepartment) => void;
  onClearFilters: () => void;
  onAddProveedor: () => void;
  filterResetKey: number;
}

export default function ProveedoresToolbar({
  searchTerm,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  onClearFilters,
  onAddProveedor,
  filterResetKey
}: ProveedoresToolbarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
        <div className="min-w-[240px] flex-1">
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e: any) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <SelectField
            key={filterResetKey}
            placeholder="Todos los departamentos"
            options={DEPARTMENT_OPTIONS}
            onChange={(value) => onDepartmentChange(value as "" | BolivianDepartment)}
          />
        </div>
        {(searchTerm || departmentFilter) && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="flex shrink-0">
        <Button startIcon={<PlusIcon />} onClick={onAddProveedor}>
          Nuevo Proveedor
        </Button>
      </div>
    </div>
  );
}
