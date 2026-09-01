"use client";

import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import { useAuth } from "@/context/AuthContext";
import {
  supplierService,
  Supplier,
  BOLIVIAN_DEPARTMENT_LABELS,
  BolivianDepartment,
} from "@/services/supplierService";
import {
  ServicePointType,
  SERVICE_POINT_TYPE_OPTIONS,
  VehicleType,
  VEHICLE_TYPE_OPTIONS,
} from "@/services/logisticsEnums";
import type { QuoteRequest } from "@/services/pricingService";
import QuotePanel from "./QuotePanel";

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const DEPARTAMENTOS = (
  Object.entries(BOLIVIAN_DEPARTMENT_LABELS) as [BolivianDepartment, string][]
).map(([value, label]) => ({ value, label }));

const WEIGHT_PATTERN = /^\d*\.?\d*$/;

/**
 * Cotizador suelto: "¿cuánto sale mandar esto?".
 *
 * Cotizar no guarda nada, así que se puede usar con el cliente en el mostrador o
 * al teléfono sin ensuciar el sistema.
 */
export default function CotizadorView() {
  const { isSuperAdminUser, isSupplierUser, companyId } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // Solo el mostrador elige empresa. Un `usuarioempresa` cotiza con la suya y el
  // backend ignora lo que mande acá.
  const [supplierId, setSupplierId] = useState("");

  const [originDepartment, setOriginDepartment] = useState<BolivianDepartment>("LaPaz");
  const [destinationDepartment, setDestinationDepartment] =
    useState<BolivianDepartment>("SantaCruz");
  const [originPointType, setOriginPointType] = useState<ServicePointType>("Branch");
  const [destinationPointType, setDestinationPointType] = useState<ServicePointType>("Door");
  const [weight, setWeight] = useState("1");
  const [isExpress, setIsExpress] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("Motorcycle");

  useEffect(() => {
    if (isSupplierUser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await supplierService.getSuppliers(1, 200);
        if (!cancelled) setSuppliers(res.data);
      } catch (err) {
        console.error("Error fetching suppliers", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSupplierUser]);

  const parsedWeight = Number(weight);
  const request: QuoteRequest | null =
    !Number.isFinite(parsedWeight) || parsedWeight <= 0
      ? null
      : {
          supplierId: isSupplierUser ? companyId : supplierId || null,
          originDepartment,
          destinationDepartment,
          originPointType,
          destinationPointType,
          weight: parsedWeight,
          isExpress,
          vehicleType,
        };

  // El vehículo solo cambia el precio si alguna punta es a domicilio: en un
  // Branch → Branch no hay viaje que cobrar.
  const chargesDoorService =
    originPointType === "Door" || destinationPointType === "Door";

  return (
    <div>
      <PageBreadcrumb pageTitle="Cotizador" />
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Calcula el precio de un envío con la tarifa vigente. No guarda nada: es solo para
        responderle al cliente.
      </p>

      <ComponentCard>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!isSupplierUser && (
              <div>
                <Label required={false}>Empresa</Label>
                <select
                  className={selectClassName}
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Tarifa pública (cliente esporádico)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Una empresa con tarifa propia paga distinto que un cliente de mostrador.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label required>Departamento de origen</Label>
                <select
                  className={selectClassName}
                  value={originDepartment}
                  onChange={(e) => setOriginDepartment(e.target.value as BolivianDepartment)}
                >
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Departamento de destino</Label>
                <select
                  className={selectClassName}
                  value={destinationDepartment}
                  onChange={(e) => setDestinationDepartment(e.target.value as BolivianDepartment)}
                >
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label required>¿Cómo se despacha?</Label>
                <select
                  className={selectClassName}
                  value={originPointType}
                  onChange={(e) => setOriginPointType(e.target.value as ServicePointType)}
                >
                  {SERVICE_POINT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.value === "Door" ? "Recojo a domicilio" : "Lo traen a la sucursal"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>¿Cómo se entrega?</Label>
                <select
                  className={selectClassName}
                  value={destinationPointType}
                  onChange={(e) => setDestinationPointType(e.target.value as ServicePointType)}
                >
                  {SERVICE_POINT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.value === "Door" ? "Entrega a domicilio" : "Lo retiran en sucursal"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label required>Peso (kg)</Label>
                <Input
                  value={weight}
                  onChange={(e) => WEIGHT_PATTERN.test(e.target.value) && setWeight(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Se cobra redondeado hacia arriba: 3.2 kg se facturan como 4.
                </p>
              </div>

              {chargesDoorService && (
                <div>
                  <Label required>Vehículo</Label>
                  <select
                    className={selectClassName}
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  >
                    {VEHICLE_TYPE_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Checkbox
              id="cotizador-express"
              label="Envío expreso"
              checked={isExpress}
              onChange={setIsExpress}
            />

            {!chargesDoorService && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                De sucursal a sucursal no se cobra viaje a domicilio: el precio es solo el flete.
              </p>
            )}
          </div>

          <QuotePanel request={request} className="lg:sticky lg:top-24 h-fit" />
        </div>

        {isSuperAdminUser && (
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            Si una ruta no tiene tarifa cargada, el cotizador lo dice y te lleva al tarifario.
          </p>
        )}
      </ComponentCard>
    </div>
  );
}
