import React from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface SenderSectionProps {
  senderFullName: string;
  setSenderFullName: (val: string) => void;
  senderPhone: string;
  setSenderPhone: (val: string) => void;
  originBranchLabel: string;
}

export default function SenderSection({
  senderFullName,
  setSenderFullName,
  senderPhone,
  setSenderPhone,
  originBranchLabel,
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
          <Label>Sucursal de Origen</Label>
          <Input 
            value={originBranchLabel || "Sin sucursal asignada"} 
            disabled 
            className="bg-gray-50 text-gray-500 font-medium"
          />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            Se asigna automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
