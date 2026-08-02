import React from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import { BranchOffice } from "@/services/branchOfficeService";

interface DestinationSectionProps {
  clientFullName: string;
  setClientFullName: (val: string) => void;
  clientPhone: string;
  setClientPhone: (val: string) => void;
  destinationDepartment: string;
  setDestinationDepartment: (val: string) => void;
  destinationBranchOfficeId: string;
  setDestinationBranchOfficeId: (val: string) => void;
  clientAddress: string;
  setClientAddress: (val: string) => void;
  deliveryType: string;
  setDeliveryType: (val: string) => void;
  isExpress: boolean;
  setIsExpress: (val: boolean) => void;
  packageCount: number;
  setPackageCount: (val: number) => void;
  packageDescription: string;
  setPackageDescription: (val: string) => void;
  branchOffices: BranchOffice[];
  departamentos: { value: string; label: string }[];
  tiposEntrega: { value: string; label: string }[];
}

export default function DestinationSection({
  clientFullName,
  setClientFullName,
  clientPhone,
  setClientPhone,
  destinationDepartment,
  setDestinationDepartment,
  destinationBranchOfficeId,
  setDestinationBranchOfficeId,
  clientAddress,
  setClientAddress,
  deliveryType,
  setDeliveryType,
  isExpress,
  setIsExpress,
  packageCount,
  setPackageCount,
  packageDescription,
  setPackageDescription,
  branchOffices,
  departamentos,
  tiposEntrega,
}: DestinationSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold">
          2
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Datos del Cliente y Destino
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-2">
          <Label required>Nombre del Cliente</Label>
          <Input
            value={clientFullName}
            onChange={(e) => setClientFullName(e.target.value)}
            required
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div>
          <Label required>Teléfono del Cliente</Label>
          <Input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            required
            placeholder="Ej. +591 7XXXXXXX"
          />
        </div>

        <div>
          <Label required>Departamento de Destino</Label>
          <select
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            value={destinationDepartment}
            onChange={(e) => setDestinationDepartment(e.target.value)}
            required
          >
            {departamentos.map((dep) => (
              <option key={dep.value} value={dep.value}>
                {dep.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label required>Sucursal de Destino</Label>
          <select
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            value={destinationBranchOfficeId}
            onChange={(e) => setDestinationBranchOfficeId(e.target.value)}
            required
          >
            <option value="" disabled>Seleccione la sucursal</option>
            {branchOffices.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label required>Tipo de Entrega</Label>
          <select
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value)}
            required
          >
            {tiposEntrega.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <Label required>Dirección Exacta (Destino)</Label>
          <Input
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            required
            placeholder="Ej. Av. Principal #123, Zona Sur"
          />
        </div>

        <div>
          <Label required>Cantidad de Paquetes</Label>
          <Input
            type="number"
            min="1"
            value={packageCount}
            onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <Label required>Descripción de Paquetes</Label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                required
                placeholder="Ej. 3 cajas grandes con ropa"
              />
            </div>
            <div className="shrink-0 flex items-center h-11 px-3 rounded-lg border border-brand-200 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500/20">
              <Checkbox
                id="isExpress"
                label="Envío Expreso Prioritario"
                checked={isExpress}
                onChange={setIsExpress}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
