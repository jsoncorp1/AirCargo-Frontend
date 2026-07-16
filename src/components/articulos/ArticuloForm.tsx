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
  onSubmit: (data: ArticuloFormData) => void;
  onCancel: () => void;
}

const emptyData = (empresas: Empresa[]): ArticuloFormData => ({
  nombre: "",
  sku: "",
  categoria: "",
  empresaId: empresas[0]?.id ?? "",
  precio: 0,
  stock: 0,
  estado: "Activo",
  imagenUrl: "",
});

const CATEGORIAS = ["Empaque", "Seguridad", "Almacenaje", "Manipuleo", "Equipos", "Otros"];

export default function ArticuloForm({ mode, initialData, empresas, onSubmit, onCancel }: ArticuloFormProps) {
  const [data, setData] = useState<ArticuloFormData>(initialData ?? emptyData(empresas));
  const readOnly = mode === "view";

  const set = <K extends keyof ArticuloFormData>(key: K, value: ArticuloFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const titles: Record<typeof mode, string> = {
    create: "Registrar nuevo artículo",
    edit: "Editar artículo",
    view: "Detalle del artículo",
  };

  return (
    <div className="p-6 lg:p-8">
      <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        {titles[mode]}
      </h4>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Nombre del Artículo</Label>
            <Input
              defaultValue={data.nombre}
              disabled={readOnly}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej. Caja de cartón 40x30"
            />
          </div>
          <div>
            <Label>SKU / Código</Label>
            <Input
              defaultValue={data.sku}
              disabled={readOnly}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="Ej. CAJ-4030"
            />
          </div>
          <div>
            <Label>Empresa Proveedora</Label>
            <SelectField
              placeholder="Seleccione la empresa"
              options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
              defaultValue={data.empresaId}
              onChange={(value) => set("empresaId", value)}
            />
          </div>
          <div>
            <Label>Categoría</Label>
            <SelectField
              placeholder="Seleccione la categoría"
              options={CATEGORIAS.map(c => ({ value: c, label: c }))}
              defaultValue={data.categoria}
              onChange={(value) => set("categoria", value)}
            />
          </div>
          <div>
            <Label>Precio Unitario (Bs)</Label>
            <Input
              type="number"
              defaultValue={String(data.precio)}
              disabled={readOnly}
              onChange={(e) => set("precio", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Stock Disponible</Label>
            <Input
              type="number"
              defaultValue={String(data.stock)}
              disabled={readOnly}
              onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>URL de Imagen (Opcional)</Label>
            <Input
              defaultValue={data.imagenUrl}
              disabled={readOnly}
              onChange={(e) => set("imagenUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <Switch
          key={`estado-${data.estado}`}
          label="Artículo activo"
          defaultChecked={data.estado === "Activo"}
          onChange={(checked) => set("estado", (checked ? "Activo" : "Inactivo") as ArticuloEstado)}
        />

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button onClick={() => onSubmit(data)}>
              {mode === "create" ? "Registrar Artículo" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
