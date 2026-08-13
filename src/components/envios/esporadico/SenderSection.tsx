import React from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { BranchOffice } from "@/services/branchOfficeService";

interface SenderSectionProps {
  senderFullName: string;
  setSenderFullName: (val: string) => void;
  senderPhone: string;
  setSenderPhone: (val: string) => void;
  originBranchLabel: string;
  // El superadmin no tiene sucursal propia: elige desde cuál atiende, y esa
  // sucursal define además el departamento de origen de la orden generada.
  canChooseOriginBranch: boolean;
  branchOffices: BranchOffice[];
  originBranchOfficeId: string;
  setOriginBranchOfficeId: (val: string) => void;
}

export default function SenderSection({
  senderFullName,
  setSenderFullName,
  senderPhone,
  setSenderPhone,
  originBranchLabel,
  canChooseOriginBranch,
  branchOffices,
  originBranchOfficeId,
  setOriginBranchOfficeId,
}: SenderSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold">
          1
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Origen y Remitente
        </h3>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <Label required>Nombre del Remitente</Label>
          <Input
            value={senderFullName}
            onChange={(e) => setSenderFullName(e.target.value)}
            required
            placeholder="Ej. María Gómez"
          />
        </div>

        <div>
          <Label required>Teléfono del Remitente</Label>
          <Input
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            required
            placeholder="Ej. +591 7XXXXXXX"
          />
        </div>

        <div>
          <Label required={canChooseOriginBranch}>Sucursal de Origen</Label>
          {canChooseOriginBranch ? (
            <>
              <select
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={originBranchOfficeId}
                onChange={(e) => setOriginBranchOfficeId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Seleccione la sucursal de origen
                </option>
                {branchOffices.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.city}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Define el origen del envío y el departamento de la orden.
              </p>
            </>
          ) : (
            <>
              <Input
                value={originBranchLabel}
                disabled
                className="bg-gray-50 text-gray-500 font-medium"
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Se asigna automáticamente.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
