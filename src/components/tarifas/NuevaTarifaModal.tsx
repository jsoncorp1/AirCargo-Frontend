"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { pricingService, getPricingErrorMessage } from "@/services/pricingService";
import { driverSettlementService } from "@/services/driverSettlementService";
import {
  supplierService,
  Supplier,
  BOLIVIAN_DEPARTMENT_LABELS,
  BolivianDepartment,
} from "@/services/supplierService";
import { VehicleType, VEHICLE_TYPE_OPTIONS } from "@/services/logisticsEnums";
import { DriverType, DRIVER_TYPE_OPTIONS } from "@/services/driverService";
import { DriverTaskKind, DRIVER_TASK_KIND_LABELS } from "@/services/driverTaskService";
import { todayApiDay } from "@/utils/datetime";

export type TarifaKind = "shipping" | "door" | "commission";

interface NuevaTarifaModalProps {
  kind: TarifaKind;
  onClose: () => void;
  onSaved: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const DEPARTAMENTOS = (
  Object.entries(BOLIVIAN_DEPARTMENT_LABELS) as [BolivianDepartment, string][]
).map(([value, label]) => ({ value, label }));

const PRICE_PATTERN = /^\d*\.?\d*$/;

const TITLES: Record<TarifaKind, string> = {
  shipping: "Nueva vigencia de flete",
  door: "Nueva vigencia de servicio a domicilio",
  commission: "Nueva vigencia de comisión",
};

/**
 * Alta de la SIGUIENTE vigencia.
 *
 * No es un formulario de edición: el backend cierra sola la tarifa que regía
 * para la misma clave (empresa + ruta + modo, o empresa + departamento +
 * vehículo, o conductor + vehículo + tarea) y esta pasa a regir desde su fecha.
 */
export default function NuevaTarifaModal({ kind, onClose, onSaved }: NuevaTarifaModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  // Común a flete y puerta: vacío = tarifa pública (la de los esporádicos).
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [validFrom, setValidFrom] = useState(todayApiDay());

  // Flete
  const [originDepartment, setOriginDepartment] = useState<BolivianDepartment>("LaPaz");
  const [destinationDepartment, setDestinationDepartment] =
    useState<BolivianDepartment>("SantaCruz");
  const [isExpress, setIsExpress] = useState(false);
  const [firstKgPrice, setFirstKgPrice] = useState("");
  const [additionalKgPrice, setAdditionalKgPrice] = useState("");

  // Puerta
  const [department, setDepartment] = useState<BolivianDepartment>("LaPaz");
  const [vehicleType, setVehicleType] = useState<VehicleType>("Motorcycle");
  const [tripCost, setTripCost] = useState("");

  // Comisión
  const [driverType, setDriverType] = useState<DriverType>("Fixed");
  const [taskKind, setTaskKind] = useState<DriverTaskKind>("Delivery");
  const [fixedAmount, setFixedAmount] = useState("");
  const [percentOfDoorCharge, setPercentOfDoorCharge] = useState("0");

  useEffect(() => {
    // La comisión no se cobra por empresa: no hace falta el listado.
    if (kind === "commission") return;
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
  }, [kind]);

  const decimalSetter = (setter: (v: string) => void) => (raw: string) => {
    if (PRICE_PATTERN.test(raw)) setter(raw);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    runSubmit(async () => {
      try {
        if (kind === "shipping") {
          if (!firstKgPrice.trim() || !additionalKgPrice.trim()) {
            showToast("error", "Faltan datos", "Cargá el precio del primer kilo y del adicional.");
            return;
          }
          await pricingService.createShippingRate({
            supplierId: supplierId || null,
            originDepartment,
            destinationDepartment,
            isExpress,
            firstKgPrice: Number(firstKgPrice),
            additionalKgPrice: Number(additionalKgPrice),
            validFrom: validFrom || null,
          });
        } else if (kind === "door") {
          if (!tripCost.trim()) {
            showToast("error", "Faltan datos", "Cargá el costo del viaje.");
            return;
          }
          await pricingService.createDoorServiceRate({
            supplierId: supplierId || null,
            department,
            vehicleType,
            tripCost: Number(tripCost),
            validFrom: validFrom || null,
          });
        } else {
          if (!fixedAmount.trim()) {
            showToast("error", "Faltan datos", "Cargá el monto fijo de la comisión.");
            return;
          }
          await driverSettlementService.createCommissionRate({
            driverType,
            vehicleType,
            taskKind,
            fixedAmount: Number(fixedAmount),
            percentOfDoorCharge: Number(percentOfDoorCharge) || 0,
            validFrom: validFrom || null,
          });
        }

        showToast(
          "success",
          "Tarifa cargada",
          "Rige desde la fecha indicada; la vigencia anterior quedó cerrada."
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast("error", "Error", getPricingErrorMessage(err, "No se pudo cargar la tarifa."));
      }
    });
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{TITLES[kind]}</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          La tarifa que rige hoy para esta misma combinación se cierra sola al guardar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
        {kind !== "commission" && (
          <div>
            <Label required={false}>Empresa</Label>
            <select
              className={selectClassName}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              {/* Sin empresa NO es "sin dato": es la tarifa que se le aplica a
                  los envíos esporádicos y a toda empresa sin tarifa propia. */}
              <option value="">Tarifa pública (esporádicos)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {kind === "shipping" && (
          <>
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
            </div>

            {/* Expreso es una FILA aparte, no un recargo: para cubrir una ruta
                hay que cargar las dos. */}
            <Checkbox
              id="rate-express"
              label="Tarifa expresa (es una fila distinta de la normal)"
              checked={isExpress}
              onChange={setIsExpress}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label required>Primer kilo (Bs)</Label>
                <Input
                  value={firstKgPrice}
                  onChange={(e) => decimalSetter(setFirstKgPrice)(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label required>Kilo adicional (Bs)</Label>
                <Input
                  value={additionalKgPrice}
                  onChange={(e) => decimalSetter(setAdditionalKgPrice)(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              Flete = primer kilo + (kilos facturables − 1) × kilo adicional. El peso se redondea
              hacia arriba.
            </p>
          </>
        )}

        {kind === "door" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label required>Departamento</Label>
                <select
                  className={selectClassName}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as BolivianDepartment)}
                >
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
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
            </div>

            <div>
              <Label required>Costo del viaje (Bs)</Label>
              <Input
                value={tripCost}
                onChange={(e) => decimalSetter(setTripCost)(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Se cobra una vez por cada extremo del envío que sea a domicilio.
              </p>
            </div>
          </>
        )}

        {kind === "commission" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label required>Tipo de conductor</Label>
                <select
                  className={selectClassName}
                  value={driverType}
                  onChange={(e) => setDriverType(e.target.value as DriverType)}
                >
                  {DRIVER_TYPE_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
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
            </div>

            <div>
              <Label required>Tipo de tarea</Label>
              <select
                className={selectClassName}
                value={taskKind}
                onChange={(e) => setTaskKind(e.target.value as DriverTaskKind)}
              >
                {(Object.entries(DRIVER_TASK_KIND_LABELS) as [DriverTaskKind, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  )
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label required>Monto fijo (Bs)</Label>
                <Input
                  value={fixedAmount}
                  onChange={(e) => decimalSetter(setFixedAmount)(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label required={false}>% del cargo de puerta</Label>
                <Input
                  value={percentOfDoorCharge}
                  onChange={(e) => decimalSetter(setPercentOfDoorCharge)(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              Comisión = monto fijo + cargo de puerta × porcentaje ÷ 100.
            </p>
          </>
        )}

        <div>
          <Label required={false}>
            Rige desde
            <span className="ml-1 text-xs font-normal text-gray-400">(vacío = hoy)</span>
          </Label>
          <Input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Cargar tarifa"}
          </Button>
        </div>
      </form>
    </div>
  );
}
