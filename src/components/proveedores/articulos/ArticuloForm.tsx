"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { Articulo, ArticuloEstado } from "@/data/mock/articulos";
import { Empresa } from "@/data/mock/empresas";

export type ArticuloFormData = Omit<Articulo, "id" | "fechaRegistro">;

interface ArticuloFormProps {
  mode: "create" | "edit" | "view";
  initialData: Articulo | null;
  empresas: Empresa[];
  defaultEmpresaId?: string;
  onSubmit: (data: ArticuloFormData) => void;
  onCancel: () => void;
}

export default function ArticuloForm({
  mode,
  initialData,
  empresas,
  defaultEmpresaId,
  onSubmit,
  onCancel,
}: ArticuloFormProps) {
  const emptyData: ArticuloFormData = {
    nombre: "",
    sku: "",
    categoria: "",
    empresaId: defaultEmpresaId ?? empresas[0]?.id ?? "",
    precio: 0,
    stock: 0,
    estado: "Activo",
  };
  const [data, setData] = useState<ArticuloFormData>(initialData ?? emptyData);
  const readOnly = mode === "view";

  const set = <K extends keyof ArticuloFormData>(key: K, value: ArticuloFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const titles: Record<typeof mode, string> = {
    create: "Nuevo artículo",
    edit: "Editar artículo",
    view: "Detalle de artículo",
  };

  return (
    <div className="p-6 lg:p-8">
      <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        {titles[mode]}
      </h4>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nombre del artículo</Label>
            <Input
              defaultValue={data.nombre}
              disabled={readOnly}
              onChange={(e) => set("nombre", e.target.value)}
            />
          </div>
          <div>
            <Label>SKU</Label>
            <Input
              defaultValue={data.sku}
              disabled={readOnly}
              onChange={(e) => set("sku", e.target.value)}
            />
          </div>
          <div>
            <Label>Categoría</Label>
            <Input
              defaultValue={data.categoria}
              disabled={readOnly}
              onChange={(e) => set("categoria", e.target.value)}
            />
          </div>
          <div>
            <Label>Precio (S/)</Label>
            <Input
              type="number"
              step={0.01}
              defaultValue={data.precio}
              disabled={readOnly}
              onChange={(e) => set("precio", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Stock</Label>
            <Input
              type="number"
              defaultValue={data.stock}
              disabled={readOnly}
              onChange={(e) => set("stock", Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Empresa</Label>
            <SelectField
              placeholder="Selecciona una empresa"
              defaultValue={data.empresaId}
              options={empresas.map((e) => ({ value: e.id, label: e.nombre }))}
              onChange={(value) => set("empresaId", value)}
              className={readOnly ? "pointer-events-none opacity-60" : ""}
            />
          </div>
        </div>

        <Switch
          key={`estado-${data.estado}`}
          label="Artículo activo"
          defaultChecked={data.estado === "Activo"}
          disabled={readOnly}
          onChange={(checked) => set("estado", (checked ? "Activo" : "Inactivo") as ArticuloEstado)}
        />

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button onClick={() => onSubmit(data)} disabled={!data.empresaId}>
              {mode === "create" ? "Crear artículo" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
