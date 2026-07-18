"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { Supplier } from "@/services/supplierService";

export type EmpresaFormData = Omit<Supplier, "id">;

interface EmpresaFormProps {
  mode: "create" | "edit" | "view";
  initialData: Supplier | null;
  onSubmit: (data: EmpresaFormData) => void;
  onCancel: () => void;
}

const emptyData: EmpresaFormData = {
  name: "",
  description: "",
};

export default function EmpresaForm({ mode, initialData, onSubmit, onCancel }: EmpresaFormProps) {
  const [data, setData] = useState<EmpresaFormData>(initialData ?? emptyData);
  const readOnly = mode === "view";

  const set = <K extends keyof EmpresaFormData>(key: K, value: EmpresaFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const titles: Record<typeof mode, string> = {
    create: "Nueva empresa proveedora",
    edit: "Editar empresa proveedora",
    view: "Detalle de empresa proveedora",
  };

  return (
    <div className="p-6 lg:p-8">
      <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        {titles[mode]}
      </h4>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <Label required>Nombre de la empresa</Label>
            <Input
              defaultValue={data.name}
              disabled={readOnly}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Acme Corp"
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <TextArea
              placeholder="Descripción o información adicional"
              value={data.description ?? ""}
              disabled={readOnly}
              onChange={(value) => set("description", value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button onClick={() => onSubmit(data)}>
              {mode === "create" ? "Crear empresa" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
