import React from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import { BranchOffice } from "@/services/branchOfficeService";
import {
  PaymentType,
  PaymentMethod,
  ServicePointType,
  SERVICE_POINT_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  paymentTypeOptions,
} from "@/services/logisticsEnums";

interface DestinationSectionProps {
  clientFullName: string;
  setClientFullName: (val: string) => void;
  clientPhone: string;
  setClientPhone: (val: string) => void;
  clientPhoneAlt: string;
  setClientPhoneAlt: (val: string) => void;
  destinationDepartment: string;
  setDestinationDepartment: (val: string) => void;
  destinationBranchOfficeId: string;
  setDestinationBranchOfficeId: (val: string) => void;
  destinationPointType: ServicePointType;
  setDestinationPointType: (val: ServicePointType) => void;
  clientAddress: string;
  setClientAddress: (val: string) => void;
  destinationLocationUrl: string;
  setDestinationLocationUrl: (val: string) => void;
  destinationAddressReference: string;
  setDestinationAddressReference: (val: string) => void;
  branchOffices: BranchOffice[];
  departamentos: { value: string; label: string }[];
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

// Un envío esporádico NO puede ir a cuenta corriente: no hay empresa a la que
// cargarle el saldo, y el backend lo rechaza con `billing.supplier.required`.
const FORMAS_DE_PAGO = paymentTypeOptions(false);

export default function DestinationSection({
  clientFullName,
  setClientFullName,
  clientPhone,
  setClientPhone,
  clientPhoneAlt,
  setClientPhoneAlt,
  destinationDepartment,
  setDestinationDepartment,
  destinationBranchOfficeId,
  setDestinationBranchOfficeId,
  destinationPointType,
  setDestinationPointType,
  clientAddress,
  setClientAddress,
  destinationLocationUrl,
  setDestinationLocationUrl,
  destinationAddressReference,
  setDestinationAddressReference,
  branchOffices,
  departamentos,
}: DestinationSectionProps) {
  // El backend valida que la sucursal pertenezca al departamento declarado
  // (`sporadicshipment.destinationbranch.mismatch`), así que el selector solo
  // puede ofrecer las de ese departamento. Antes listaba toda la red y se
  // podían armar combinaciones que el backend ahora rechaza.
  const branchesInDepartment = branchOffices.filter(
    (b) => b.bolivianDepartment === destinationDepartment
  );

  const handleDepartmentChange = (value: string) => {
    setDestinationDepartment(value);
    // La sucursal elegida deja de ser válida al cambiar de departamento.
    setDestinationBranchOfficeId("");
  };

  const isBranchPickup = destinationPointType === "Branch";

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
        <div className="sm:col-span-2 lg:col-span-1">
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
          <Label required={false}>
            Teléfono alternativo
            <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
          </Label>
          <Input
            value={clientPhoneAlt}
            onChange={(e) => setClientPhoneAlt(e.target.value)}
            placeholder="Otro número por si no contesta"
          />
        </div>

        <div>
          <Label required>Departamento de Destino</Label>
          <select
            className={selectClassName}
            value={destinationDepartment}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            required
          >
            {departamentos.map((dep) => (
              <option key={dep.value} value={dep.value}>
                {dep.label}
              </option>
            ))}
          </select>
        </div>

        {/* La modalidad decide el final del envío: en sucursal espera un retiro
            en mostrador, a domicilio va un conductor. */}
        <div>
          <Label required>¿Cómo lo recibe?</Label>
          <select
            className={selectClassName}
            value={destinationPointType}
            onChange={(e) => setDestinationPointType(e.target.value as ServicePointType)}
            required
          >
            {SERVICE_POINT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            {isBranchPickup
              ? "Espera en la sucursal hasta que lo retiren."
              : "Un conductor lo lleva al domicilio."}
          </p>
        </div>

        <div>
          <Label required>Sucursal de Destino</Label>
          <select
            className={selectClassName}
            value={destinationBranchOfficeId}
            onChange={(e) => setDestinationBranchOfficeId(e.target.value)}
            required
            disabled={branchesInDepartment.length === 0}
          >
            <option value="" disabled>Seleccione la sucursal</option>
            {branchesInDepartment.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.city}
              </option>
            ))}
          </select>
          {branchesInDepartment.length === 0 && (
            <p className="mt-1.5 text-xs text-error-500">
              No hay sucursales en este departamento.
            </p>
          )}
        </div>

        {/* Los datos del domicilio solo tienen sentido si va un conductor. */}
        {!isBranchPickup && (
          <>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label required>Dirección Exacta (Destino)</Label>
              <Input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                required
                placeholder="Ej. Av. Principal #123, Zona Sur"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <Label required={false}>
                Enlace de mapa
                <span className="ml-1 text-xs font-normal text-gray-400">(recomendado)</span>
              </Label>
              <Input
                value={destinationLocationUrl}
                onChange={(e) => setDestinationLocationUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/…"
              />
            </div>

            <div>
              <Label required={false}>
                Referencia
                <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </Label>
              <Input
                value={destinationAddressReference}
                onChange={(e) => setDestinationAddressReference(e.target.value)}
                placeholder="Ej. Portón verde"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
