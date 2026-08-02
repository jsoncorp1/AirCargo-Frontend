import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { BranchOffice } from "@/services/branchOfficeService";
import { BolivianDepartment, BOLIVIAN_DEPARTMENT_LABELS } from "@/services/supplierService";

interface SucursalFormModalProps {
  branchOffice?: BranchOffice | null;
  isSaving: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
  error?: string | null;
}

const DEPARTAMENTOS = Object.entries(BOLIVIAN_DEPARTMENT_LABELS) as [BolivianDepartment, string][];

export default function SucursalFormModal({
  branchOffice,
  isSaving,
  onSave,
  onCancel,
  error,
}: SucursalFormModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    bolivianDepartment: "LaPaz" as BolivianDepartment,
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
  });

  useEffect(() => {
    if (branchOffice) {
      setFormData({
        code: branchOffice.code,
        bolivianDepartment: branchOffice.bolivianDepartment,
        city: branchOffice.city,
        address: branchOffice.address || "",
        latitude: branchOffice.latitude ? String(branchOffice.latitude) : "",
        longitude: branchOffice.longitude ? String(branchOffice.longitude) : "",
        phone: branchOffice.phone,
      });
    } else {
      setFormData({
        code: "",
        bolivianDepartment: "LaPaz",
        city: "",
        address: "",
        latitude: "",
        longitude: "",
        phone: "",
      });
    }
  }, [branchOffice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {branchOffice ? "Editar Sucursal" : "Crear Nueva Sucursal"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {branchOffice
            ? `Modificando la sucursal: ${branchOffice.code}.`
            : "Completa los campos para registrar una nueva sucursal."}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 px-6 py-5 max-h-[70vh] overflow-y-auto"
      >
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Código de Sucursal</Label>
            <Input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="Ej. LPZ-01"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label required>Teléfono</Label>
            <Input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="Ej. +591 7XXXXXXX"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label required>Departamento</Label>
            <select
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50"
              value={formData.bolivianDepartment}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bolivianDepartment: e.target.value as BolivianDepartment,
                })
              }
              required
              disabled={isSaving}
            >
              {DEPARTAMENTOS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label required>Ciudad / Zona</Label>
            <Input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              placeholder="Ej. El Alto"
              disabled={isSaving}
            />
          </div>
        </div>

        <div>
          <Label>Dirección Detallada</Label>
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Ej. Av. Juan Pablo II, Edificio..."
            disabled={isSaving}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Latitud (Opcional)</Label>
            <Input
              type="text"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder="-16.500000"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label>Longitud (Opcional)</Label>
            <Input
              type="text"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder="-68.119271"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Sucursal"}
          </Button>
        </div>
      </form>
    </div>
  );
}
