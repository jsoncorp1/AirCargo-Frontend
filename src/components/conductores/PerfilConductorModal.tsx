"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import {
  driverService,
  Driver,
  DriverType,
  DRIVER_TYPE_OPTIONS,
  driverTypeRequiresSalary,
  getDriverErrorMessage,
} from "@/services/driverService";
import { VehicleType, VEHICLE_TYPE_OPTIONS } from "@/services/logisticsEnums";

interface PerfilConductorModalProps {
  /** El usuario conductor al que se le carga o edita el perfil. */
  driverUserId: string;
  driverName: string;
  /** El perfil actual, si ya tiene uno: entonces es una edición. */
  profile?: Driver | null;
  onClose: () => void;
  onSaved: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const DECIMAL_PATTERN = /^\d*\.?\d*$/;

/**
 * Perfil del conductor: con qué vehículo trabaja y bajo qué modalidad.
 *
 * Sin perfil el backend rechaza cualquier asignación
 * (`drivertask.driver.noprofile`), así que esta pantalla es lo que habilita a
 * una persona a recibir recojos y repartos.
 */
export default function PerfilConductorModal({
  driverUserId,
  driverName,
  profile,
  onClose,
  onSaved,
}: PerfilConductorModalProps) {
  const { showToast } = useToast();
  const { pending: submitting, run: runSubmit } = useSubmitLock();
  const isEdit = !!profile;

  const [driverType, setDriverType] = useState<DriverType>(profile?.driverType ?? "Fixed");
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    profile?.vehicleType ?? "Motorcycle"
  );
  const [plateNumber, setPlateNumber] = useState(profile?.plateNumber ?? "");
  const [vehicleBrand, setVehicleBrand] = useState(profile?.vehicleBrand ?? "");
  const [vehicleModel, setVehicleModel] = useState(profile?.vehicleModel ?? "");
  const [vehicleColor, setVehicleColor] = useState(profile?.vehicleColor ?? "");
  const [vehicleYear, setVehicleYear] = useState(
    profile?.vehicleYear ? String(profile.vehicleYear) : ""
  );
  const [monthlySalary, setMonthlySalary] = useState(
    profile?.monthlySalary ? String(profile.monthlySalary) : ""
  );

  const needsSalary = driverTypeRequiresSalary(driverType);

  // El sueldo es obligatorio en un conductor de planta y está PROHIBIDO en uno
  // esporádico: hay un CHECK en la base de datos, así que dejarlo cargado al
  // cambiar de modalidad haría fallar el guardado sin un mensaje claro.
  const handleDriverTypeChange = (next: DriverType) => {
    setDriverType(next);
    if (!driverTypeRequiresSalary(next)) setMonthlySalary("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!plateNumber.trim() || !vehicleBrand.trim() || !vehicleModel.trim()) {
      showToast("error", "Faltan datos", "La placa, la marca y el modelo son obligatorios.");
      return;
    }
    if (needsSalary && !monthlySalary.trim()) {
      showToast(
        "error",
        "Falta el sueldo",
        "Un conductor de planta necesita un sueldo mensual cargado."
      );
      return;
    }

    const payload = {
      driverType,
      vehicleType,
      plateNumber: plateNumber.trim().toUpperCase(),
      vehicleBrand: vehicleBrand.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleColor: vehicleColor.trim() || null,
      vehicleYear: vehicleYear.trim() ? Number(vehicleYear) : null,
      // `null` y no 0 en el esporádico: el backend lo prohíbe, no lo quiere en cero.
      monthlySalary: needsSalary ? Number(monthlySalary) : null,
    };

    runSubmit(async () => {
      try {
        if (isEdit) {
          await driverService.updateDriver(driverUserId, payload);
          showToast("success", "Perfil actualizado", `Se guardó el perfil de ${driverName}.`);
        } else {
          await driverService.createDriver({ driverUserId, ...payload });
          showToast(
            "success",
            "Perfil creado",
            `${driverName} ya puede recibir recojos y entregas.`
          );
        }
        onSaved();
        onClose();
      } catch (err: unknown) {
        showToast("error", "Error", getDriverErrorMessage(err, "No se pudo guardar el perfil."));
      }
    });
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? "Editar perfil de conductor" : "Cargar perfil de conductor"}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{driverName}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label required>Modalidad</Label>
            <select
              className={selectClassName}
              value={driverType}
              onChange={(e) => handleDriverTypeChange(e.target.value as DriverType)}
            >
              {DRIVER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              {needsSalary
                ? "Siempre disponible para recibir tareas."
                : "Solo recibe tareas mientras se marque en línea desde su app."}
            </p>
          </div>

          <div>
            <Label required>Vehículo</Label>
            <select
              className={selectClassName}
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
            >
              {VEHICLE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Define a qué recojos se lo puede asignar: el pedido tiene que coincidir.
            </p>
          </div>

          <div>
            <Label required>Placa</Label>
            <Input
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="Ej. 1234-ABC"
            />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Única entre conductores activos.
            </p>
          </div>

          <div>
            <Label required>Marca</Label>
            <Input
              value={vehicleBrand}
              onChange={(e) => setVehicleBrand(e.target.value)}
              placeholder="Ej. Honda"
            />
          </div>

          <div>
            <Label required>Modelo</Label>
            <Input
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="Ej. CG 150"
            />
          </div>

          <div>
            <Label required={false}>
              Color
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </Label>
            <Input
              value={vehicleColor}
              onChange={(e) => setVehicleColor(e.target.value)}
              placeholder="Ej. Rojo"
            />
          </div>

          <div>
            <Label required={false}>
              Año
              <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
            </Label>
            <Input
              type="number"
              value={vehicleYear}
              onChange={(e) => setVehicleYear(e.target.value)}
              placeholder="Ej. 2021"
            />
          </div>

          {/* Solo el de planta: en un esporádico el backend PROHÍBE el campo. */}
          {needsSalary && (
            <div>
              <Label required>Sueldo mensual (Bs)</Label>
              <Input
                value={monthlySalary}
                onChange={(e) =>
                  DECIMAL_PATTERN.test(e.target.value) && setMonthlySalary(e.target.value)
                }
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
          )}
        </div>

        {!needsSalary && (
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
            Un conductor esporádico no lleva sueldo: cobra por comisión, según el tarifario de
            comisiones vigente.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear perfil"}
          </Button>
        </div>
      </form>
    </div>
  );
}
