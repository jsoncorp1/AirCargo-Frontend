import React from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import { PlusIcon } from "@/icons";

interface ArticulosToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  estadoFilter: "" | "Activo" | "Inactivo";
  onEstadoChange: (val: "" | "Activo" | "Inactivo") => void;
  empresaFilter: string;
  onEmpresaChange: (val: string) => void;
  empresasOptions: { value: string; label: string }[];
  onClearFilters: () => void;
  onAddArticulo: () => void;
  filterResetKey: number;
}

export default function ArticulosToolbar({
  searchTerm,
  onSearchChange,
  estadoFilter,
  onEstadoChange,
  empresaFilter,
  onEmpresaChange,
  empresasOptions,
  onClearFilters,
  onAddArticulo,
  filterResetKey
}: ArticulosToolbarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full xl:w-auto">
        <div className="min-w-[240px] flex-1">
          <Input
            placeholder="Buscar por artículo, sku, proveedor..."
            value={searchTerm}
            onChange={(e: any) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <SelectField
            key={`estado-${filterResetKey}`}
            placeholder="Todos los estados"
            options={[
              { value: "Activo", label: "Activo" },
              { value: "Inactivo", label: "Inactivo" },
            ]}
            onChange={(val) => onEstadoChange(val as "" | "Activo" | "Inactivo")}
          />
        </div>
        <div className="w-full sm:w-64">
          <SelectField
            key={`proveedor-${filterResetKey}`}
            placeholder="Todos los proveedores"
            options={empresasOptions}
            onChange={(val) => onEmpresaChange(val as string)}
          />
        </div>
        {(searchTerm || estadoFilter || empresaFilter) && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="flex shrink-0">
        <Button startIcon={<PlusIcon />} onClick={onAddArticulo}>
          Nuevo Artículo
        </Button>
      </div>
    </div>
  );
}
