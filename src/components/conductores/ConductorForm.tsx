"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Conductor, ConductorEstado } from "@/data/mock/conductores";

export type ConductorFormData = Omit<Conductor, "id" | "fechaRegistro" | "calificacion">;

interface ConductorFormProps {
  mode: "create" | "edit" | "view";
  initialData: Conductor | null;
  onSubmit: (data: ConductorFormData) => void;
  onCancel: () => void;
}

const emptyData: ConductorFormData = {
  nombre: "",
  telefono: "",
  licencia: "",
  placaVehiculo: "",
  tipoVehiculo: "",
  estado: "Disponible",
  fotoUrl: "",
};

export default function ConductorForm({ mode, initialData, onSubmit, onCancel }: ConductorFormProps) {
  const [data, setData] = useState<ConductorFormData>(initialData ?? emptyData);
  const readOnly = mode === "view";

  const set = <K extends keyof ConductorFormData>(key: K, value: ConductorFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const titles: Record<typeof mode, string> = {
    create: "Registrar nuevo conductor",
    edit: "Editar conductor",
    view: "Detalle del conductor",
  };

  return (
    <div className="p-6 lg:p-8">
      <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        {titles[mode]}
      </h4>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label required>Nombre Completo</Label>
            <Input
              defaultValue={data.nombre}
              disabled={readOnly}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <Label required>Teléfono</Label>
            <Input
              defaultValue={data.telefono}
              disabled={readOnly}
              onChange={(e) => set("telefono", e.target.value)}
              placeholder="+591 70000000"
            />
          </div>
          <div>
            <Label required>Licencia de Conducir</Label>
            <Input
              defaultValue={data.licencia}
              disabled={readOnly}
              onChange={(e) => set("licencia", e.target.value)}
              placeholder="Categoría y Número"
            />
          </div>
          <div>
            <Label required>Placa del Vehículo</Label>
            <Input
              defaultValue={data.placaVehiculo}
              disabled={readOnly}
              onChange={(e) => set("placaVehiculo", e.target.value)}
              placeholder="Ej. 1234-ABC"
            />
          </div>
          <div>
            <Label required>Tipo de Vehículo</Label>
            <Input
              defaultValue={data.tipoVehiculo}
              disabled={readOnly}
              onChange={(e) => set("tipoVehiculo", e.target.value)}
              placeholder="Ej. Furgoneta 3T, Camión 10T"
            />
          </div>
          <div>
            <Label>URL de Foto de Perfil (Opcional)</Label>
            <Input
              defaultValue={data.fotoUrl}
              disabled={readOnly}
              onChange={(e) => set("fotoUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <Label required>Estado del Conductor</Label>
          <SelectField
            placeholder="Seleccione el estado"
            options={[
              { value: "Disponible", label: "Disponible" },
              { value: "En Ruta", label: "En Ruta" },
              { value: "Inactivo", label: "Inactivo" },
            ]}
            defaultValue={data.estado}
            onChange={(value) => set("estado", value as ConductorEstado)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button onClick={() => onSubmit(data)}>
              {mode === "create" ? "Registrar Conductor" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
