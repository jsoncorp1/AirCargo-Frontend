"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import SelectField from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import AvatarText from "@/components/ui/avatar/AvatarText";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { UserIcon, BoxCubeIcon } from "@/icons";
import { BOLIVIAN_DEPARTMENT_LABELS, BolivianDepartment, Supplier } from "@/services/supplierService";

export type EmpresaFormData = Omit<Supplier, "id">;

interface EmpresaFormProps {
  mode: "create" | "edit" | "view";
  initialData: Supplier | null;
  onSubmit: (data: EmpresaFormData) => void | Promise<void>;
  onCancel: () => void;
}

const emptyData: EmpresaFormData = {
  name: "",
  description: "",
};

const DEPARTMENT_OPTIONS = (Object.keys(BOLIVIAN_DEPARTMENT_LABELS) as BolivianDepartment[]).map(
  (value) => ({ value, label: BOLIVIAN_DEPARTMENT_LABELS[value] })
);

export default function EmpresaForm({ mode, initialData, onSubmit, onCancel }: EmpresaFormProps) {
  const [data, setData] = useState<EmpresaFormData>(initialData ?? emptyData);
  // Cerrojo: evita que un doble click cree la empresa dos veces.
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const set = <K extends keyof EmpresaFormData>(key: K, value: EmpresaFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const titles: Record<typeof mode, string> = {
    create: "Nueva empresa proveedora",
    edit: "Editar empresa proveedora",
    view: "Detalle de empresa proveedora",
  };

  if (mode === "view" && initialData) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-4">
          <AvatarText name={initialData.name} />
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {initialData.name}
            </h4>
            {initialData.department ? (
              <Badge size="sm" color="light">{BOLIVIAN_DEPARTMENT_LABELS[initialData.department]}</Badge>
            ) : (
              <span className="text-theme-xs text-gray-400">Sin departamento asignado</span>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
              <UserIcon className="size-5" />
            </div>
            <div>
              <p className="text-theme-xs text-gray-400">Usuarios</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {initialData.userQuantity ?? 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
              <BoxCubeIcon className="size-5" />
            </div>
            <div>
              <p className="text-theme-xs text-gray-400">Artículos</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {initialData.articleQuantity ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Label>Descripción</Label>
          <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-theme-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
            {initialData.description?.trim() || "Sin descripción"}
          </p>
        </div>

        <div className="flex items-center justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>Cerrar</Button>
        </div>
      </div>
    );
  }

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
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Acme Corp"
            />
          </div>
          <div>
            <Label>Departamento</Label>
            <SelectField
              placeholder="Selecciona un departamento"
              options={DEPARTMENT_OPTIONS}
              defaultValue={data.department ?? ""}
              onChange={(value) => set("department", (value || undefined) as BolivianDepartment | undefined)}
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <TextArea
              placeholder="Descripción o información adicional"
              value={data.description ?? ""}
              onChange={(value) => set("description", value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
          <Button onClick={() => runSubmit(() => onSubmit(data))} disabled={submitting}>
            {submitting ? "Guardando…" : mode === "create" ? "Crear empresa" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
