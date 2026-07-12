"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { UsuarioProveedor, UsuarioEstado, UsuarioRol } from "@/data/mock/usuarios";
import { Empresa } from "@/data/mock/empresas";

export type UsuarioFormData = Omit<UsuarioProveedor, "id" | "fechaRegistro">;

interface UsuarioFormProps {
  mode: "create" | "edit" | "view";
  initialData: UsuarioProveedor | null;
  empresas: Empresa[];
  defaultEmpresaId?: string;
  onSubmit: (data: UsuarioFormData) => void;
  onCancel: () => void;
}

const roles: UsuarioRol[] = ["Administrador", "Operador", "Despachador"];

export default function UsuarioForm({
  mode,
  initialData,
  empresas,
  defaultEmpresaId,
  onSubmit,
  onCancel,
}: UsuarioFormProps) {
  const emptyData: UsuarioFormData = {
    nombre: "",
    email: "",
    telefono: "",
    empresaId: defaultEmpresaId ?? empresas[0]?.id ?? "",
    rol: "Operador",
    estado: "Activo",
  };
  const [data, setData] = useState<UsuarioFormData>(initialData ?? emptyData);
  const readOnly = mode === "view";

  const set = <K extends keyof UsuarioFormData>(key: K, value: UsuarioFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const titles: Record<typeof mode, string> = {
    create: "Nuevo usuario proveedor",
    edit: "Editar usuario proveedor",
    view: "Detalle de usuario proveedor",
  };

  return (
    <div className="p-6 lg:p-8">
      <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        {titles[mode]}
      </h4>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Nombre completo</Label>
            <Input
              defaultValue={data.nombre}
              disabled={readOnly}
              onChange={(e) => set("nombre", e.target.value)}
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
            <Label>Teléfono</Label>
            <Input
              defaultValue={data.telefono}
              disabled={readOnly}
              onChange={(e) => set("telefono", e.target.value)}
            />
          </div>
          <div>
            <Label>Rol</Label>
            <SelectField
              placeholder="Selecciona un rol"
              defaultValue={data.rol}
              options={roles.map((r) => ({ value: r, label: r }))}
              onChange={(value) => set("rol", value as UsuarioRol)}
              className={readOnly ? "pointer-events-none opacity-60" : ""}
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
          label="Usuario activo"
          defaultChecked={data.estado === "Activo"}
          disabled={readOnly}
          onChange={(checked) => set("estado", (checked ? "Activo" : "Inactivo") as UsuarioEstado)}
        />

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button onClick={() => onSubmit(data)} disabled={!data.empresaId}>
              {mode === "create" ? "Crear usuario" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
