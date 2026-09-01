"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import { useToast } from "@/context/ToastContext";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useAuth } from "@/context/AuthContext";
import { driverService, Driver, driverTypeLabel } from "@/services/driverService";
import { vehicleTypeLabel } from "@/services/logisticsEnums";
import { ShipmentPaginatedItem } from "@/services/shipmentService";
import { driverTaskService, getDriverTaskErrorMessage } from "@/services/driverTaskService";

interface AssignShipmentsModalProps {
  shipments: ShipmentPaginatedItem[];
  onClose: () => void;
  onSaved: () => void;
}

const selectClassName =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function AssignShipmentsModal({
  shipments,
  onClose,
  onSaved,
}: AssignShipmentsModalProps) {
  const { showToast } = useToast();
  const { isSuperAdminUser, branchOfficeId } = useAuth();
  const { pending: submitting, run: runSubmit } = useSubmitLock();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [driverUserId, setDriverUserId] = useState("");

  // Todos los envíos seleccionados llegaron a la misma sucursal destino (la
  // pantalla solo lista los de una), así que alcanza con mirar el primero.
  const destinationBranchOfficeId = shipments[0]?.destinationBranchOfficeId ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Solo los que PUEDEN recibir la tarea ahora: el backend exige perfil
        // (`drivertask.driver.noprofile`) y, si es esporádico, que esté en línea
        // (`drivertask.driver.offline`). Ofrecer los demás es ofrecer un error.
        const res = await driverService.getDrivers(1, 100, {
          availableOnly: true,
          // El admin ya viene acotado server-side; mandarlo evita que el
          // superadmin vea conductores de otras sucursales mezclados.
          ...(destinationBranchOfficeId
            ? { branchOfficeId: destinationBranchOfficeId }
            : branchOfficeId
            ? { branchOfficeId }
            : {}),
        });
        if (!cancelled) setDrivers(res.data);
      } catch (err) {
        console.error("Error fetching available drivers", err);
      } finally {
        if (!cancelled) setLoadingDrivers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [destinationBranchOfficeId, branchOfficeId]);

  const totalWeight = shipments.reduce((sum, s) => sum + s.totalWeight, 0);
  const selectedDriver = drivers.find((d) => d.driverUserId === driverUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverUserId) {
      showToast("error", "Error", "Selecciona el conductor que va a repartir.");
      return;
    }

    runSubmit(async () => {
      try {
        const res = await driverTaskService.createTasks({
          driverUserId,
          shipmentIds: shipments.map((s) => s.id),
        });
        showToast(
          "success",
          "Envíos asignados",
          `${res.assignedCount} envío(s) quedaron a cargo de ${res.driverFullName}.`
        );
        onSaved();
        onClose();
      } catch (err: unknown) {
        // Todo-o-nada: si uno falla no se asignó ninguno.
        showToast(
          "error",
          "No se asignó ninguno",
          getDriverTaskErrorMessage(err, "No se pudieron asignar los envíos.")
        );
      }
    });
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Asignar a un conductor
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {shipments.length} envío(s) · {totalWeight.toFixed(2)} kg
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        <div>
          <Label required>Conductor</Label>
          <select
            className={selectClassName}
            value={driverUserId}
            onChange={(e) => setDriverUserId(e.target.value)}
            disabled={loadingDrivers || drivers.length === 0}
            required
          >
            <option value="" disabled>
              {loadingDrivers ? "Cargando conductores…" : "Selecciona el conductor"}
            </option>
            {drivers.map((d) => (
              <option key={d.driverUserId} value={d.driverUserId}>
                {d.fullName} — {vehicleTypeLabel(d.vehicleType)} {d.plateNumber}
                {isSuperAdminUser && d.branchOfficeCode ? ` · ${d.branchOfficeCode}` : ""}
              </option>
            ))}
          </select>

          {selectedDriver && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge size="sm" color="light">
                {driverTypeLabel(selectedDriver.driverType)}
              </Badge>
              <Badge size="sm" color="light">
                {vehicleTypeLabel(selectedDriver.vehicleType)}
              </Badge>
              {selectedDriver.phoneNumber && (
                <a
                  href={`tel:${selectedDriver.phoneNumber}`}
                  className="font-mono text-xs text-brand-500 hover:underline"
                >
                  {selectedDriver.phoneNumber}
                </a>
              )}
            </div>
          )}

          {!loadingDrivers && drivers.length === 0 && (
            <p className="mt-2 text-xs text-error-500">
              No hay conductores disponibles en esta sucursal. Revisa que tengan perfil cargado y,
              si son esporádicos, que estén en línea.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Envíos a asignar
          </p>
          <ul className="max-h-52 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {shipments.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {s.code}
                </span>
                <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">
                  {s.clientFullName}
                </span>
                <span className="shrink-0 text-xs text-gray-500">{s.totalWeight} kg</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" disabled={submitting || !driverUserId}>
            {submitting ? "Asignando…" : "Asignar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
