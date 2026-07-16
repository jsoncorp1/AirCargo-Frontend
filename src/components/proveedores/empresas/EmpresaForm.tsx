"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { Empresa, EmpresaEstado } from "@/data/mock/empresas";

export type EmpresaFormData = Omit<Empresa, "id" | "fechaRegistro">;

interface EmpresaFormProps {
  mode: "create" | "edit" | "view";
  initialData: Empresa | null;
  onSubmit: (data: EmpresaFormData) => void;
  onCancel: () => void;
}

const emptyData: EmpresaFormData = {
  nombre: "",
  nit: "",
  contacto: "",
  telefono: "",
  email: "",
  ciudad: "",
  direccion: "",
  estado: "Activo",
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Nombre de la empresa</Label>
            <Input
              defaultValue={data.nombre}
              disabled={readOnly}
              onChange={(e) => set("nombre", e.target.value)}
            />
          </div>
          <div>
            <Label>RUC / NIT</Label>
            <Input
              defaultValue={data.nit}
              disabled={readOnly}
              onChange={(e) => set("nit", e.target.value)}
            />
          </div>
          <div>
            <Label>Persona de contacto</Label>
            <Input
              defaultValue={data.contacto}
              disabled={readOnly}
              onChange={(e) => set("contacto", e.target.value)}
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              defaultValue={data.telefono}
              disabled={readOnly}
              onChange={(e) => set("telefono", e.target.value)}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              defaultValue={data.email}
              disabled={readOnly}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <Label>Ciudad</Label>
            <Input
              defaultValue={data.ciudad}
              disabled={readOnly}
              onChange={(e) => set("ciudad", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Dirección</Label>
          <TextArea
            placeholder="Dirección de la empresa"
            value={data.direccion}
            disabled={readOnly}
            onChange={(value) => set("direccion", value)}
            rows={2}
          />
        </div>

        <Switch
          key={`estado-${data.estado}`}
          label="Empresa activa"
          defaultChecked={data.estado === "Activo"}
          disabled={readOnly}
          onChange={(checked) => set("estado", (checked ? "Activo" : "Inactivo") as EmpresaEstado)}
        />

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
