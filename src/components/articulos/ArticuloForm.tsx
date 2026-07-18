"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { Supplier } from "@/services/supplierService";
import { CreateArticleRequest } from "@/services/articleService";

export type ArticuloFormData = CreateArticleRequest;

interface ArticuloFormProps {
  mode: "create" | "edit" | "view";
  initialData: CreateArticleRequest | null;
  empresas: Supplier[];
  onSubmit: (data: ArticuloFormData) => void;
  onCancel: () => void;
}

const emptyData = (empresas: Supplier[]): ArticuloFormData => ({
  name: "",
  sku: "",
  supplierId: empresas[0]?.id ?? "",
  price: 0,
  count: 0,
});

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
            <Label required>Nombre del Artículo</Label>
            <Input
              defaultValue={data.name}
              disabled={readOnly}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Caja de cartón 40x30"
            />
          </div>
          <div>
            <Label required>SKU / Código</Label>
            <Input
              defaultValue={data.sku}
              disabled={readOnly}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="Ej. CAJ-4030"
            />
          </div>
          <div className="sm:col-span-2">
            <Label required>Empresa Proveedora</Label>
            <SelectField
              placeholder="Seleccione la empresa"
              options={empresas.map(e => ({ value: e.id, label: e.name }))}
              defaultValue={data.supplierId}
              onChange={(value) => set("supplierId", value)}
            />
          </div>
          <div>
            <Label required>Precio Unitario (Bs)</Label>
            <Input
              type="number"
              defaultValue={String(data.price)}
              disabled={readOnly}
              onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label required>Stock Disponible</Label>
            <Input
              type="number"
              defaultValue={String(data.count)}
              disabled={readOnly}
              onChange={(e) => set("count", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

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
